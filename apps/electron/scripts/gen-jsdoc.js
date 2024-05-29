const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../src/renderer/jsapi');
const outputDir = path.join(__dirname, '../../docs/tmp');

async function gen() {
    const inputs = await fs.promises.readdir(inputDir, { recursive: true })
    const _inputs = inputs.map((i) => path.join(inputDir, i));
    const templateData = await jsdoc2md.getTemplateData({ files: _inputs });

    const classNames = templateData.reduce((classNames, identifier) => {
        if (identifier.kind === 'class') classNames.push(identifier.name);
        return classNames;
    }, []);

    for (const className of classNames) {
        const template = `{{#class name="${className}"}}{{>docs}}{{/class}}`;
        console.log(`rendering ${className}, template: ${template}`);
        const output = await jsdoc2md.render({ data: templateData, template: template });
        await fs.promises.writeFile(path.resolve(outputDir, `${className}.md`), output);
    }
}

gen()
    .then(() => console.log('done'))
    .catch((e) => {
        console.log('failed to gen jsdoc:', e);
    });