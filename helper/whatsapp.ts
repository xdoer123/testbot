import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@adiwajshing/baileys'
import { Boom } from '@hapi/boom'
import { Request, RequestHandler, Response } from 'express'
import qr from 'qr-image'

const session = new Map()
const VAR = 'VAR_SESSION'
const ADMIN = '6283821323308'
let connectionStatus: string = 'sedang cek koneksi'
let qrCode: string;


export const initWhatsApp = async() => {
    await connectToWhatsApp()
}

export const getStatus: RequestHandler = async(req: Request, res: Response) => {
    if (qrCode == null || qrCode == undefined) {
        res.json({
            succes: true,
            data: connectionStatus,
            message: 'Sukses menampilkan STATUS'
        })
    }else {
        var code = qr.image(qrCode, {type: 'png'})
    res.setHeader('Content-type', 'image/png')
    code.pipe(res)
    }
}

export const sendMessage: RequestHandler = async(req: Request, res: Response) => {
    const {namaPemesan , nomorPemesan, tanggal} = req.body
    //kirim custumer
    const msgCustumer = `terimakasih telah memesan di layanan kami \n\ndetails pesanan anda:\nnama Pemesan: ${namaPemesan}\nnomor Pemesan: ${nomorPemesan}\nTanggal: ${tanggal}\n\nmohon tunggu admin akan segera mengkonfirmasi pesanan anda!!!`
    await session.get(VAR).sendMessage(`${nomorPemesan}@s.whatsapp.net`, {text: msgCustumer})
    //kirim admin
    const msgAdmin = `hallo admin ada pesanan masuk dengan details berikut:\nnama Pemesan: ${namaPemesan}\nnomor Pemesan: ${nomorPemesan}\nTanggal: ${tanggal}\n\nsegera konfirmasi pesanan dengan menghubungi https//wa.me/${nomorPemesan}`
    await session.get(VAR).sendMessage(`${ADMIN}@s.whatsapp.net`, {text: msgAdmin})

    res.json({
        success: true,
        data: `hallo ${namaPemesan}\n\n dengan no ${nomorPemesan}`,
        message: 'Success'
    })
}

async function connectToWhatsApp () {
    const {state, saveCreds} =await useMultiFileAuthState('auth')
    const sock = makeWASocket({
        // can provide additional config here
        printQRInTerminal: true,
        auth:state
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (update.qr) {
            qrCode = update.qr
        }
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            connectionStatus = 'closed'
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            connectionStatus = 'connected'
            console.log('opened connection')
        }
    })
    sock.ev.on('messages.upsert', async m => {
        console.log(JSON.stringify(m, undefined, 2))

        console.log('replying to', m.messages[0].key.remoteJid)
    })

    session.set(VAR, sock)
}
