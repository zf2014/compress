/**
 *  
 *  @desc: 工具包
 *  
 *  @author: qzzf1987@gmail.com
 * 
 *  @create: 2014-02-12 
 *  
 *  @last: 2014-02-12
 *
 */




 var fs = require('fs');

 exports.hasChanged = function(srcfile, minfile){
    return fs.statSync(srcfile).mtime.getTime() > fs.statSync(minfile).mtime.getTime();
    // return true;
 };