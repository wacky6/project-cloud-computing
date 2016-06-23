#!/usr/bin/env node

'use strict'

const {createInterface} = require('readline')

const IN_DOC_DELIM = "；"
const CN_DELIM = "·，。、！@＃％…&＊（）［］【】｛｝‘“’”：；？／《》—"
const EN_DELIM = ",.:;'\"\\[\\]{}\|!@#$%^&*()<>_\\-+= \\t/"
const ETC_DELIM = "↓"
const ALPHANUM_DELIM = "[a-zA-Z0-9_\\-]"

const re_fixed_usage = /(\d+年)?(\d+)月(\d+)日/g
const re_delim = new RegExp(`[${CN_DELIM}${EN_DELIM}]+|${ALPHANUM_DELIM}+`, 'g')
const re_delim_aggregate = new RegExp(`${IN_DOC_DELIM}+`, 'g')

let consec = 0
let doc = ''

/* detect non-utf8 char by looking for Unicode Replacement character
 * used to represent invalid chars by `request` module */
const isUTF8 = (str) => str.indexOf('\ufffd')===-1

/* split by delimiter, merge newlines */
const splitDelimiter = (str) => str.replace(re_fixed_usage, IN_DOC_DELIM)
                                   .replace(re_delim, IN_DOC_DELIM)
                                   .split(/[\r\n]+/g)
                                   .join(IN_DOC_DELIM)
                                   .replace(re_delim_aggregate, IN_DOC_DELIM)

createInterface({
    input: process.stdin
})
.on('line', (ln)=>{
    ln = ln.trim()
    consec = ln.length ? 0 : consec+1

    doc = doc + ln + '\n'

    if (consec===3) {    // end of document
        if (isUTF8(doc)) {
            process.stdout.write(splitDelimiter(doc))
            process.stdout.write('\n')
        }
        consec = 0
        doc = ''
    }
})
.on('close', ()=>{

})
