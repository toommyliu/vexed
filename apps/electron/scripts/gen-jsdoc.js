const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs');
const path = require('path');
const util = require('util');

const inputDir = path.join(__dirname, '../src/renderer/jsapi');
const outputDir = path.join(__dirname, '../../docs/api');

async function gen() {
    const inputs = await fs.promises.readdir(inputDir, { recursive: true })
    const _inputs = inputs.map((i) => path.join(inputDir, i));
    const templateData = await jsdoc2md.getTemplateData({ files: _inputs });

    const classNames = templateData.reduce((classNames, identifier) => {
        if (identifier.kind === 'class') classNames.push(identifier.name);
        return classNames;
    }, []);

    const obj = [];
    for (const className of classNames) {
        const template = `{{#class name="${className}"}}{{>docs}}{{/class}}`;
        console.log(`rendering ${className}`);
        const output = await jsdoc2md.render({ data: templateData, template: template });
        await fs.promises.writeFile(path.resolve(outputDir, `${className.toLowerCase()}.md`), output);
        obj.push({ text: `"${className}"`, link: `"/api/${className.toLowerCase()}"` });
    }
    const out = obj.map(item => `{ text: ${item.text}, link: ${item.link} },`).join('\n');
    console.log(out);
}

gen()
    .then(() => console.log('done'))
    .catch((e) => {
        console.log('failed to gen jsdoc:', e);
    });