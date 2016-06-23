#!/usr/bin/env node

'use strict'
const {createInterface} = require('readline')

const PER_DOC_THRESHOLD = 2
const IN_DOC_DELIM = "；"

let res = {}

function nGram(ln, n=2) {
    let arr = []
    if (ln.length < n)
        return []
    if (ln.length === n)
        return [ln]
    for (let i=0; i<=ln.length-n; ++i)
        arr.push(ln.substr(i, n))
    return arr
}

function findConcat(arr) {
    let left, right
    left = arr.find( word => {
        let last = word.substr(-1)
        right = arr.find( _word => _word.indexOf(last)===0 && _word!==word )
        return right
    })
    if (left && right)
        return [left, right]
    else
        return undefined
}

function uniq(arr) {
    return [ ... (new Set(arr)) ]
}

function ObjectValues(obj) {
    return Object.keys(obj).map(key => obj[key])
}

let perDoc = {}
let count = 0

createInterface({
    input: process.stdin
})
.on('line', (ln)=>{
    perDoc = {}

    ln.split(IN_DOC_DELIM)
      .forEach( str => {
          for (let word of nGram(str)) {
              if (!perDoc[word])
                  perDoc[word]=0
              ++perDoc[word]
          }
      })

    // perform adaptive ngram
    for (let word in perDoc)
        if (perDoc[word] < PER_DOC_THRESHOLD)
            delete perDoc[word]
    let occurances = uniq(ObjectValues(perDoc))
    let words = Object.keys(perDoc)
    for (let occurance of occurances) {
        let cur = words.filter( word => perDoc[word] === occurance )
        let pair
        while ( (pair = findConcat(cur)) ){
            let [left, right] = pair
            let merged = `${left}${right.substr(1)}`
            cur.push(merged)
            perDoc[merged] = perDoc[left]
            delete perDoc[left]
            delete perDoc[right]
            cur.splice(cur.indexOf(left), 1)
            cur.splice(cur.indexOf(right), 1)
        }
    }

    // merge to result
    for (let word in perDoc) {
        if (!res[word])
            res[word] = 0
        res[word] += perDoc[word]
    }

    if ( ++count % 1024 === 0 )
        process.stderr.write(`${count}\n`)
})
.on('close', ()=>{
    process.stdout.write(JSON.stringify(res))
})
