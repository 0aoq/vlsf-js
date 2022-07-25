/**
 * @file Replace "Blob" constructor to make a better Node.js version that is compliant with the browser standard
 * @name BlobReplace.ts
 * @author 0aoq <hkau@oxvs.net>
 * @license MIT
 */

import * as crypto from 'crypto'
import * as fs from 'fs'

/**
 * @global
 * @name BlobStore
 * @description Save all blob objects
 */
export let BlobStore = {}

/**
 * @class Blob
 * @desciption create a new blob
 */
export class Blob {
    content: [string]
    type: string
    id: number

    constructor(content: [string], options: { type: string }) {
        // VLSF only uses blob content as a single input so it will not be joined together
        this.content = [`\n${content[0]
            /* .replaceAll("export const ", "module.exports.")
            .replaceAll("export let ", "module.exports.")
            .replaceAll("export function ", "module.exports.")
            .replaceAll("export default ", "module.exports.default = ") */
            }`]

        this.type =
            options.type === "text/javascript" ? "mjs" :
                options.type === "text/plain" ? "txt" : ""

        this.id = crypto.getRandomValues(new Uint32Array(1))[0]

        BlobStore[this.id] = this

        if (!fs.existsSync(`${process.cwd()}/VLSF_TMP_BLOB_STORE`)) fs.mkdirSync(`${process.cwd()}/VLSF_TMP_BLOB_STORE`)
        fs.writeFileSync(`${process.cwd()}/VLSF_TMP_BLOB_STORE/${this.id}.${this.type}`, this.content[0])

        return this
    }

    public DeleteBlob() {
        delete BlobStore[this.id]
    }

    public CreateUrl() {
        return `${process.cwd()}/VLSF_TMP_BLOB_STORE/${this.id}.${this.type}`
    }
}

/**
 * @global
 * @name URL
 * @description Fake URL class
 */
export const URL = {
    /**
     * @function createObjectURL
     * 
     * @param {object} blob The fake blob created from the "Blob" class
     * @returns {string} blob system path
     */
    createObjectURL: (blob: any) => {
        return blob.CreateUrl()
    }
}

/**
 * @function fetch
 * @description Change fetch function fetch from file system instead
 * 
 * @param {string} path
 */
export function fetch(path: string) {
    return new Promise((resolve, reject) => {
        const content = fs.readFileSync(path, { encoding: "utf-8" })
        resolve({
            text: () => {
                return new Promise((_resolve, _reject) => {
                    _resolve(content)
                })
            }
        })
    })
}

/**
 * @global
 * @type fetchReturn
 * @description Return type based on fetch function
 */
export type fetchReturn = {
    text: any
}

/**
 * @function cleanUpBlobs
 * @description Clean up all blobs
 */
export function cleanUpBlobs() {
    fs.rmSync(`${process.cwd()}/VLSF_TMP_BLOB_STORE`, { recursive: true })
}

export default {
    BlobStore,

    Blob,
    URL,

    fetch,
    cleanUpBlobs
}