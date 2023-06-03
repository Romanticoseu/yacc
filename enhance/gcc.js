/**
 * seulex - GCC调用器
 * by czh @ 2020-5
 */
const ChildProcess = require('child_process')
module.exports.callGCC = function callGCC(cfile, params) {
  console.log('[GCC.JS] Calling gcc...')
  ChildProcess.exec(
    `gcc ${cfile} -o ${cfile.substring(0, cfile.length - 1) + 'exe'} ${params}`
  )
  console.log('[GCC.JS] gcc called.')
}
