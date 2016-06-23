#!/usr/bin/env node

'use strict'
const {createInterface} = require('readline')

const THRESHOLD = 100

let res = {}

createInterface({
    input: process.stdin
})
.on('line', (ln)=>{
    if (!ln)
        return
    let j = JSON.parse(ln)
    for (let word in j) {
        if (!res[word])
            res[word] = 0
        res[word] += j[word]
    }
})
.on('close', ()=>{
    for (let word in res)
        if (res[word] < THRESHOLD)
            delete res[word]
    process.stdout.write(JSON.stringify(res))
})
