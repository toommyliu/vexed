var og_console_log = console.log;
console.log = (...args) => {
    const prefixedArgs = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg);
    og_console_log(`[worker]`, ...prefixedArgs);
};

var on = false;
var index = 0;
var canContinue = false;

var _canContinue = () => canContinue === false;

onmessage = async (event) => {
    og_console_log(`[worker] got a message`, event.data);

    const data = event.data;
    const ev = data.event;

    if (ev === 'start') {
        console.log('starting bot');
        on = true;
        index = 0;

        await start(data.commands);
    } else if (ev === 'stop') {
        console.log('stopping bot');
        on = false;
        index = 0;
    } else if (ev === 'continue') {
        canContinue = true;
    }
}

async function start(commands) {
    console.log(`got a total of ${commands.length} commands`);

    while (on && index < commands.length) {
        console.log(`running ${index + 1}/${commands.length}: ${commands[index]}`);

        postMessage({ event: commands[index] });

        await new Promise(r => setTimeout(r, 1000));

        index++;
        canContinue = false;

        while (!_canContinue()) {
            og_console_log(new Date(), 'waiting...');
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log('Bot stopped or finished commands.');
    stop();
}

function stop() {
    on = false;
}
