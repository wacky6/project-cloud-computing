#!/usr/bin/env node

'use strict'
const {createInterface} = require('readline')

// freq: descending order
const sortFreq = (a,b) => b.freq - a.freq

let arr = []

createInterface({
    input: process.stdin
})
.on('line', (ln)=>{
    if (!ln)
        return
    let j = JSON.parse(ln)
    for (let word in j)
        arr.push({
            str:  word,
            freq: j[word]
        })
})
.on('close', ()=>{
    arr.sort(sortFreq)
    for (let i=0; i!==arr.length; ++i)
        process.stdout.write(`${arr[i].str},${arr[i].freq}\n`)
})
