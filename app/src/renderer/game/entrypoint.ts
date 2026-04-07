window.onProgress = (progress) => console.log(`Progress: ${progress}%`);
window.onConnection = (status) => console.log(`Connection status: ${status}`);
window.onDebug = (message) => console.log(`Debug: ${message}`);
window.onExtensionResponse = (packet) => console.log(`Extension response: ${packet}`);
window.onLoaded = () => console.log("Game loaded");
window.packetFromClient = (packet) => console.log(`Packet from client: ${packet}`);
window.packetFromServer = (packet) => console.log(`Packet from server: ${packet}`);

