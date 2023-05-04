"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getStatus = exports.initWhatsApp = void 0;
const baileys_1 = __importStar(require("@adiwajshing/baileys"));
const qr_image_1 = __importDefault(require("qr-image"));
const session = new Map();
const VAR = 'VAR_SESSION';
const ADMIN = '6283821323308';
let connectionStatus = 'sedang cek koneksi';
let qrCode;
const initWhatsApp = () => __awaiter(void 0, void 0, void 0, function* () {
    yield connectToWhatsApp();
});
exports.initWhatsApp = initWhatsApp;
const getStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (qrCode == null || qrCode == undefined) {
        res.json({
            succes: true,
            data: connectionStatus,
            message: 'Sukses menampilkan STATUS'
        });
    }
    else {
        var code = qr_image_1.default.image(qrCode, { type: 'png' });
        res.setHeader('Content-type', 'image/png');
        code.pipe(res);
    }
});
exports.getStatus = getStatus;
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { namaPemesan, nomorPemesan, tanggal } = req.body;
    //kirim custumer
    const msgCustumer = `terimakasih telah memesan di layanan kami \n\ndetails pesanan anda:\nnama Pemesan: ${namaPemesan}\nnomor Pemesan: ${nomorPemesan}\nTanggal: ${tanggal}\n\nmohon tunggu admin akan segera mengkonfirmasi pesanan anda!!!`;
    yield session.get(VAR).sendMessage(`${nomorPemesan}@s.whatsapp.net`, { text: msgCustumer });
    //kirim admin
    const msgAdmin = `hallo admin ada pesanan masuk dengan details berikut:\nnama Pemesan: ${namaPemesan}\nnomor Pemesan: ${nomorPemesan}\nTanggal: ${tanggal}\n\nsegera konfirmasi pesanan dengan menghubungi https//wa.me/${nomorPemesan}`;
    yield session.get(VAR).sendMessage(`${ADMIN}@s.whatsapp.net`, { text: msgAdmin });
    res.json({
        success: true,
        data: `hallo ${namaPemesan}\n\n dengan no ${nomorPemesan}`,
        message: 'Success'
    });
});
exports.sendMessage = sendMessage;
function connectToWhatsApp() {
    return __awaiter(this, void 0, void 0, function* () {
        const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)('auth');
        const sock = (0, baileys_1.default)({
            // can provide additional config here
            printQRInTerminal: true,
            auth: state
        });
        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('connection.update', (update) => {
            var _a, _b;
            const { connection, lastDisconnect } = update;
            if (update.qr) {
                qrCode = update.qr;
            }
            if (connection === 'close') {
                const shouldReconnect = ((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== baileys_1.DisconnectReason.loggedOut;
                console.log('connection closed due to ', lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error, ', reconnecting ', shouldReconnect);
                // reconnect if not logged out
                connectionStatus = 'closed';
                if (shouldReconnect) {
                    connectToWhatsApp();
                }
            }
            else if (connection === 'open') {
                connectionStatus = 'connected';
                console.log('opened connection');
            }
        });
        sock.ev.on('messages.upsert', (m) => __awaiter(this, void 0, void 0, function* () {
            console.log(JSON.stringify(m, undefined, 2));
            console.log('replying to', m.messages[0].key.remoteJid);
        }));
        session.set(VAR, sock);
    });
}
