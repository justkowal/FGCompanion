/*
Here you can write your own placeholders
For precompiled versions you are limited to already used libs
If you have any libs that you want to use and you are using Source Code version
import them in this file

All placeholders should be packed as object where key is the placeholder name
and combined with stock ones then used in callback

Also, returned values will overwrite stock ones so you can edit existing placeholders,
including icon when using custom RPC

GLHF
*/

module.exports = function(callback, stockplaceholders) {
    /*
    here write code that will define the Placeholders.
    Unless you fully know what you are doing, assign placeholders like this:
    var customplaceholders = {
        plhd1:val,
        plhd2:val
    }
    */

    callback({...stockplaceholders, ...customplaceholders})
}