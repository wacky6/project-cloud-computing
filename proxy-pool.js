'use strict'

const {readFileSync: read} = require('fs')

const pool = JSON.parse(read('proxy-pool.json').toString('utf-8'))
             .filter( ($)=>$.priority < 5000 )
let idx = 0

module.exports = function nextProxy() {
    // simple round robin
    let {addr, port} = pool[idx]
    idx = (idx+1) % pool.length
    return `http://${addr}:${port}/`
}
