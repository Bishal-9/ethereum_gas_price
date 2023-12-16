
require("dotenv").config()

const { WebSocket } = require("ws")

const base_url = "wss://mainnet.infura.io/ws/v3/" + process.env.INFURA_API_KEY.toString().trim()

let fetching_interval
let last_gas_price = 0

const stream = () => {

    const socket = new WebSocket(base_url)

    socket.once("open", () => {
        console.log("Infura Socket connection opened successfully at", new Date().toLocaleDateString('en-IN', { dateStyle: "full" }), new Date().toLocaleTimeString('en-IN', { timeStyle: "full" }))

        if (!fetching_interval) {

            fetching_interval = setInterval(() => {
                socket.send(
                    JSON.stringify({
                        jsonrpc: "2.0",
                        method: "eth_gasPrice",
                        params: [],
                        id: 1,
                    }),
                    (_error) => {
                        if (_error) {
                            console.log(
                                "Infura Socket Subscription Error: ",
                                _error
                            )
                            socket.close(
                                1000,
                                "Closing due to subscription error"
                            )
                        // } else {
                        //     console.log(
                        //         "Infura Socket Subscription Successfully at ",
                        //         new Date().toLocaleDateString("en-IN", {
                        //             dateStyle: "full",
                        //         }),
                        //         new Date().toLocaleTimeString("en-IN", {
                        //             timeStyle: "full",
                        //         })
                        //     )
                        }
                    }
                )
            }, 1000)
        }
    })
    socket.once("error", (_error) => {
        console.log("Infura Socket Error: ", _error)
        socket.close(1000, "Closing due to socket error")
    })
    socket.once("close", (_code, _reason) => {
        console.log("Infura Socket Close Code: ", _code)
        console.log("Infura Socket Close Reason: ", Buffer.from(_reason).toString())

        socket.removeAllListeners("ping")
        socket.removeAllListeners("pong")
        socket.removeAllListeners("redirect")
        socket.removeAllListeners("unexpected-response")
        socket.removeAllListeners("upgrade")
        socket.removeAllListeners("message")

        if (fetching_interval) {
            clearInterval(fetching_interval)
            fetching_interval = undefined
        }

        socket.terminate()

        stream()
    })
    socket.on("ping", (_data) => {
        console.log("Infura Socket Ping Data: ", Buffer.from(_data).toString())
    })
    socket.on("pong", (_data) => {
        console.log("Infura Socket Ping Data: ", Buffer.from(_data).toString())
    })
    socket.on("redirect", (_url, _request) => {
        console.log("Infura Socket Redirect URL: ", _url)
        console.log("Infura Socket Redirect Request Status Code: ", _request.statusCode)
        console.log("Infura Socket Redirect Request Status Message: ", _request.statusMessage)
    })
    socket.on("unexpected-response", (_request, _response) => {
        console.log("Infura Socket Unexpected Response Status Code: ", _response.statusCode)
        console.log("Infura Socket Unexpected Response Status Message: ", _response.statusMessage)
    })
    socket.on("upgrade", (_response) => {
        console.log("Infura Socket Upgrade Response Status Code: ", _response.statusCode)
        console.log("Infura Socket Upgrade Response Status Message: ", _response.statusMessage)
    })
    socket.on("message", (_data, _is_binary) => {
        // console.log("Infura Socket Message Data: ", Buffer.from(_data).toString())
        // console.log("Infura Socket Message Is Binary: ", _is_binary)

        try {
            
            const data = JSON.parse(Buffer.from(_data).toString())

            if (data?.result) {

                const updated_gas_price = parseInt(data.result)

                if (last_gas_price !== updated_gas_price) {

                    last_gas_price = updated_gas_price

                    console.log(`Gas Price at ${new Date().toLocaleDateString('en-IN', { dateStyle: "full" })} ${new Date().toLocaleTimeString('en-IN', { timeStyle: "full" })} is ${parseInt(data.result)}`)
                }
            }
        } catch (error) {
            console.log("Infura Socket Message Data: ", Buffer.from(_data).toString())
            console.log("Infura Socket Message Is Binary: ", _is_binary)
            console.log("Message parsing Error: ", error)
        }
    })
}
stream()
