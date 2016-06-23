'use strict'

const request = require('request')
const hdfs = require('webhdfs')
const nextProxy = require('./proxy-pool')
const html2text = require('html-to-text')
const cherrio = require('cheerio')
const {createWriteStream} = require('fs')

const DEPTH = 4
const CONCURRENCY = 16
const START = 'http://www.sina.com.cn/'
const HREF_CHECK = (href) =>
    href.match(/sina\.com/)
    && !href.match(/(video|live|auto|tags|app|ka|astro|hongbao|collection|games|jiaxiu|house|esf|english)\.sina/)
    && !href.match(/(lottery|show|chexian|search|help|blog|mobile)/)
    && !href.match(/(tags|slide)\.((.*)\.)?sina/)

const crawled = new Set()
const pending = []
let   exec    = 0

++exec
getUrl(START, false)
.catch( (err)=>{
    --exec
    console.log(`error ${START}: ${err.message}`)
})
.then( (body)=>{
    --exec
    crawled.add(START)
    let hrefs = extractHref(START, body)
    for (let href of hrefs)
        if (!crawled.has(href))
            pending.push({
                depth: 1,
                url:   href
            })
})

let outf = createWriteStream('out.txt')
let logf = createWriteStream('log.txt')

let itvl = setInterval( ()=>{
    if (exec===0 && pending.length===0) {
        // all done
        clearInterval(itvl)
        outf.end()
        logf.end()
    }
    if (exec < CONCURRENCY && pending.length) {
        const {depth, url, retry=0} = pending.shift()
        if (depth > DEPTH)
            return

        console.log(`spawn ${depth} ${url}`)
        ++exec

        getUrl(url)
        .catch( (err)=>{
            --exec
            console.log(`error   ${url} ${err}`)
            if (!retry)
                pending.push({depth: depth, url: url, retry: 1})
        })
        .then( (body)=>{
            --exec
            crawled.add(url)
            logf.write(`${url}\n`)
            let article = extractArticle(body)
            if (article) {
                outf.write(article+'\n\n\n\n')
                // add new hrefs
                for (let href of extractHref(url, body))
                    if (!crawled.has(href))
                        pending.push({depth: depth+1, url: href})
            }
        })
    }
}, 10)


function getUrl(url, useProxy=true) {
    return new Promise( (resolve, reject) => {
        request({
            url: url,
            headers: {'User-Agent': 'curl/7.43.0'},
            followRedirect: true,
            followAllRedirects: true,
            timeout:  30000,
            proxy:    useProxy ? nextProxy() : undefined
        }, (err, res, body)=>{
            if (err || res.statusCode!==200)
                reject(err || res.statusCode)
            else
                resolve(body)
        })
    })
}

function extractHref(baseUrl, body, el) {
    let text = html2text.fromString(body, {
        wordwrap: null,
        linkHrefBaseUrl: baseUrl,
        ignoreImage: true,
        baseElement: el
    })
    const re = /\[(http:\/\/.*?)\]/gi
    let res = []

    let m
    while ( (m=re.exec(text)) )
        if (HREF_CHECK(m[1]))
            res.push(m[1].toLowerCase())
    return res
}

function extractArticle(body) {
    body = cherrio.load(body)('#artibody').html()

    if (!body)
        return null

    let text = html2text.fromString(body, {
        wordwrap: null,
        linkHrefBaseUrl: START,
        ignoreImage: true,
        ignoreHref: true
    })

    return text
}
