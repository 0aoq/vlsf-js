import Conversions from './VLSFDefault.js'

// create URLs for resources that are reused
let vlsfGlobalUrl = ""

const vlsfGlobalBlob = new Blob([`
export const _v_sleepTimer = ${function (time: number) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true)
            }, time);
        })
    }.toString()};

// VLSFTYPECONV
export let Types = {};
export const vlsfTypeConv = ${function (input: any) {
        // @ts-ignore
        if (Types === undefined || Types === null) { return { error: "\"Types\" is not defined. Did you forget to import Global.Types?" } };
        if (typeof input === "string") {
            // @ts-ignore
            if (Types.String && typeof Types.String === "object") {
                // @ts-ignore
                for (let _function of Object.entries(Types.String)) Types.String[_function[0]] = _function[1].bind(input); return Types.String
            }
        } else if (typeof input === "number") {
            // @ts-ignore
            if (Types.Number && typeof Types.String === "object") {
                // @ts-ignore
                for (let _function of Object.entries(Types.Number)) Types.Number[_function[0]] = _function[1].bind(input); return Types.Number
            };
        } else if (typeof input === "object") {
            // @ts-ignore
            if (Types.Object && typeof Types.Object === "object") {
                // @ts-ignore
                for (let _function of Object.entries(Types.Object)) Types.Object[_function[0]] = _function[1].bind(input); return Types.Object
            };
        }

        return {};
    }.toString()};

export const importType = ${function (type: string, value: object) {
        // @ts-ignore
        Types[type] = value
    }.toString()};
    
// VLSFGLOBALMODULES
export let VLSFMODULELIST = {};

export const postModuleFull = ${function (name: string, exports: object) {
        // @ts-ignore
        VLSFMODULELIST[name] = exports
    }.toString()};

export const postModuleSegment = ${function (moduleName: string, name: string, exports: object) {
        // @ts-ignore
        if (!VLSFMODULELIST[moduleName]) VLSFMODULELIST[moduleName] = {}

        // @ts-ignore
        VLSFMODULELIST[moduleName][name] = exports
    }.toString()};
`], { type: 'text/javascript' })

vlsfGlobalUrl = URL.createObjectURL(vlsfGlobalBlob)

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
// #vlsf 0.0.2b
// #vlsf begin head

let Global = { Http: {} };
let Web = {};

let module = {};

(async () => {\n
const VLSFGLOBAL = await import("${vlsfGlobalUrl}");
\n`

    let compiled = "// #vlsf end head\n// #vlsf begin body\n"
    let outAsync = "" // all code outside of the global async function (public functions/variables)

    // go through each line
    for (let line of lines) {
        let matchedVLSFLine = false

        // add type value selector function
        line = line.replaceAll("##", "VLSFGLOBAL.vlsfTypeConv")

        // scope selectors
        if (line.match(/^\s*\[\#\]$/m)) {
            // line matches scope start block RegExp, create new JS scope
            compiled += `\n(async () => {\n`
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
                line.slice(-1) !== "(" &&
                line.slice(-1) !== ",") line += ";" // append ";" on lines (fixes some issues), only allowed if not scope selector
        }

        // variable selectors
        if (line.match(/^\s*(Declare)\<(?<TYPE>.*?)\>\s*(?<NAME>.*?)\s*\=\s*(?<VALUE>.*?)$/m)) { // Declare<type> <name> = <value>
            // matched variable create RegExp, create new JS variable
            matchedVLSFLine = true

            const { input, groups } = (line.match(/^\s*(Declare)\<(?<TYPE>.*?)\>\s*(?<NAME>.*?)\s*\=\s*(?<VALUE>.*?)$/m) as RegExpMatchArray)
            if (groups === undefined) continue

            let whitespace = input.split(/[^\s]/)[0]

            const types = groups.TYPE.split(" ")
            let mods = `${whitespace}` // everything that will end up being before the variable assignment
            let ignoreMods = false // will only be true if something that requires mods to be ignored it used

            if (types.includes("static")) { // using includes instead of === allows for the possibility for type checking and assignment
                // variable is a constant and CAN'T be changed
                mods += `const `
            } else {
                // the "static" mod CAN'T  work with anything in here
                if (types.includes("public")) {
                    // variable is not a constant and CAN be changed
                    // since it is public, other mods don't apply
                    outAsync += `${whitespace}module.${groups.NAME} = ${groups.VALUE}\n`
                    ignoreMods = true
                } else {
                    // variable is not a constant and CAN be changed
                    // can't use let if it is public because public requires it to be set under the "module" variable
                    mods += `let `
                }
            }

            if (!ignoreMods) {
                compiled += `${mods}${groups.NAME} = ${groups.VALUE}\n`
            }
        }

        if (line.match(/^\s*(Reusable)\<(?<TYPE>.*?)\>\s*(?<NAME>.*?)\s*\[(?<ARGS>.*?)\]\s*\=\s*\{$/m)) { // Reusable<type> name [args] = {
            // matched function create RegExp, create new JS function
            matchedVLSFLine = true

            const { input, groups } = (line.match(/^\s*(Reusable)\<(?<TYPE>.*?)\>\s*(?<NAME>.*?)\s*\[(?<ARGS>.*?)\]\s*\=\s*\{$/m) as RegExpMatchArray)
            if (groups === undefined) continue

            let whitespace = input.split(/[^\s]/)[0]

            if (!groups.TYPE) {
                if (groups.NAME.split("<")[1]) {
                    groups.TYPE = groups.NAME.split(">")[0]
                    groups.NAME = groups.NAME.split(">")[1].trim()
                } else if (groups.TYPE && groups.TYPE !== "") {
                    throw SyntaxError("Invalid function creation: Missing named group \"TYPE\"")
                }
            }

            groups.NAME = groups.NAME.replaceAll(/>/g, "")
            groups.TYPE = groups.TYPE.replaceAll(/>/g, "")

            groups.NAME = groups.NAME.replaceAll(/</g, "")
            groups.TYPE = groups.TYPE.replaceAll(/</g, "")

            if (groups.TYPE === "public") {
                compiled += `${whitespace}module.${groups.NAME} = (${groups.ARGS}) => {\n`
            } else {
                compiled += `${whitespace}let ${groups.NAME} = (${groups.ARGS}) => {\n`
            }
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
                const request = await fetch(groups.NAME)
                const response = await request.text()
                const text = await VLSFCompile((response as any))

                // @ts-ignore
                const blob = new Blob([text], { type: 'text/javascript' })
                const importName = groups.NAME.split("/").pop().split(".vlsf")[0]

                compiled += `const _${importName} = await import("${URL.createObjectURL(blob)}");`
                compiled += `await VLSFGLOBAL._v_sleepTimer(0.02); // wait 0.02ms (so short you won't notice) for the module to load
                if (!VLSFGLOBAL.VLSFMODULELIST["${importName}"]) { throw "Failed to import module: requested module does not exist under VLSFMODULELIST. Did you forget to add the MODULE_NAME variable to it?" }; 
                const ${importName} = VLSFGLOBAL.VLSFMODULELIST["${importName}"];`
            }
        }

        // catch if it wasn't a valid VLSF line
        if (matchedVLSFLine === false) compiled += `${line}\n` // doing this allows things such as JSON to function properly
    }

    compiled += `
    // #vlsf dynamic import manager: load all file exports
    for (let _module of Object.entries(module)) {
        if (!MODULE_NAME) { break } // this clearly isn't a module, if it is the user should've done "Declare<static> <MODULE_NAME> = 'name'"
        VLSFGLOBAL.postModuleSegment(MODULE_NAME, _module[0], _module[1]);
    }
})();`

    return `${head}\n${outAsync}\n${compiled}`
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