import Conversions from './VLSFDefault.js'

/**
 * @function VLSFCompile
 * @description Compile a VLSF string into normal JavaScript code
 * 
 * @param {string} str The entire file to compile
 */
export const VLSFCompile = async (str: string) => {
    const lines = str.split("\n")

    // create initial compiled string
    let head = `"use strict";
// #vlsf 0.0.1b
// #vlsf begin head

let Global = { Http: {} };
let Web = {};\n`

    let compiled = "// #vlsf end head\n// #vlsf begin body"

    // go through each line
    for (let line of lines) {
        let matchedVLSFLine = false

        // scope selectors
        if (line.match(/^\s*\[\#\]$/m)) {
            // line matches scope start block RegExp, create new JS scope
            compiled += `\n(() => {\n`
            matchedVLSFLine = true
        } else if (line.match(/^\s*\[\/\]$/m)) {
            // line matches scope end block RegExp, end JS scope
            compiled += `})();\n`
            matchedVLSFLine = true
        } else {
            if (
                line.slice(-1) !== ";" &&
                line.slice(-1) !== ">" &&
                line.slice(-1) !== "{" &&
                line.slice(-1) !== "}" &&
                line.slice(-1) !== " " &&
                line.slice(-1) !== "") line += ";" // append ";" on lines (fixes some issues), only allowed if not scope selector
        }

        // variable selectors
        if (line.match(/^\s*(Declare)\<(?<TYPE>.*?)\>\s*\<(?<NAME>.*?)\>\s*\=\s*(?<VALUE>.*?)$/m)) { // Declare<type> <name> = <value>
            // matched variable create RegExp, create new JS variable
            matchedVLSFLine = true

            const { input, groups } = (line.match(/^\s*(Declare)\<(?<TYPE>.*?)\>\s*\<(?<NAME>.*?)\>\s*\=\s*(?<VALUE>.*?)$/m) as RegExpMatchArray)
            if (groups === undefined) continue

            let whitespace = input.split(/[^\s]/)[0]

            if (groups.TYPE === "static") {
                // variable is a constant and CAN'T be changed
                compiled += `${whitespace}const ${groups.NAME} = ${groups.VALUE}\n`
            } else {
                // variable is not a constant and CAN be changed
                compiled += `${whitespace}let ${groups.NAME} = ${groups.VALUE}\n`
            }
        }

        if (line.match(/^\s*(Reusable)\s*\<(?<NAME>.*?)\>\s*\[(?<ARGS>.*?)\]\s*\=\s*\{$/m)) { // Reusable <name> [args] = {
            // matched function create RegExp, create new JS function
            matchedVLSFLine = true

            const { input, groups } = (line.match(/^\s*(Reusable)\s*\<(?<NAME>.*?)\>\s*\[(?<ARGS>.*?)\]\s*\=\s*\{$/m) as RegExpMatchArray)
            if (groups === undefined) continue

            let whitespace = input.split(/[^\s]/)[0]
            compiled += `${whitespace}let ${groups.NAME} = (${groups.ARGS}) => {\n`
        }

        if (line.match(/^\s*\}$/gm)) { // }
            // matched function end RegExp, end older JS function
            matchedVLSFLine = true

            let whitespace = line.match(/^\s*\}$/).input.split("}")[0]
            compiled += `${whitespace}}\n`
        }

        if (line.match(/^\s*(?<NAME>.*?)\((?<ARGS>.*?)\)$/m)) { // name(args)
            // matched function call RegExp, call a JS function
            matchedVLSFLine = true

            compiled += line + '\n'
        }

        // module import selector
        if (line.match(/^\s*\#(Include)\s*\<(?<NAME>.*?)\>$/m)) {
            // matched module import RegExp, import module from Coversions or local
            matchedVLSFLine = true

            const { groups } = (line.match(/^\s*\#(Include)\s*\<(?<NAME>.*?)\>$/m) as RegExpMatchArray)
            if (groups === undefined) continue

            if (Conversions[groups.NAME]) {
                head += Conversions[groups.NAME].ConversionObject + `; // VLSFDefault: ${groups.NAME}, ApiType: ${Conversions[groups.NAME].ApiType}\n`
            } else {
                // importing a hosted or local file
                if (window) { console.log("[VLSF]: Can't import hosted modules within browser!"); continue }
                const response = await (await (await fetch(groups.NAME)).text())
                const text = VLSFCompile((response as any))

                // @ts-ignore
                const blob = new Blob([text], { type: 'text/javascript' })
                head = `import * as ${groups.NAME.split("/").pop()} from "${URL.createObjectURL(blob)}"\n\n${head}`
            }
        }

        // catch if it wasn't a valid VLSF line
        if (matchedVLSFLine === false) compiled += `${line}\n` // doing this allows things such as JSON to function properly
    }

    return `${head}\n${compiled}`
}

/**
 * @function VLSFLoad
 * @description load all scripts in the browser DOM that have type="vlsf-script"
 */
export const VLSFLoad = async () => {
    const scripts = document.querySelectorAll("script[type=\"vlsf-script\"]")

    const runScript = async (text: string, name: string) => {
        const _function = new Function(await VLSFCompile(text))

        Object.defineProperty(_function, "name", {
            value: name,
            writable: false
        })

        _function()
    }

    for (let script of scripts) {
        if (script.getAttribute("src")) {
            // fetch script instead
            fetch((script.getAttribute("src") as string)).then(res => res.text()).then((text: string) => {
                runScript(text, script.getAttribute("src"))
            }).catch(console.error)
        } else runScript(script.innerHTML, document.title)

        script.innerHTML = await VLSFCompile(script.innerHTML)
        script.setAttribute("vlsf-compiled", "true")
    }
}