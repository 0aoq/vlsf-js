import * as compiler from './VLSFCompile'
import * as fs from 'fs'

// get first argument passed from command line
const file = process.argv[2];

// read file
(async () => {
    if (!file) {
        console.log('No file specified!')
        process.exit()
    } else if (!file.endsWith('vlsf')) {
        console.log('File must be a .vlsf file!')
        process.exit()
    }

    const fileContents = fs.readFileSync(file, 'utf8')
    new Function(await compiler.VLSFCompile(fileContents))()
})();