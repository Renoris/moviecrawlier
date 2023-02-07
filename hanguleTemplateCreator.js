

const hangul = require('hangul-js');
const fs = require('fs');

const firstWord = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ';
const middleWord = 'ㅏㅐㅓㅔㅗㅛㅜㅠㅡㅢㅣ';
const lastWord = " ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅋ"

console.log(firstWord.length * middleWord.length * lastWord.length);

let words = '';

let count = 0;
for (let i = 0; i < firstWord.length; i++) {
    for(let j = 0; j < middleWord.length; j++){
        for(let k = 0; k <middleWord.length; k++) {
            words += hangul.assemble([firstWord[i], middleWord[j], lastWord[k]]);
            count ++;
        }
    }
}

fs.writeFile('/Users/applet/desktop/hangul.txt', words, (err) => {
    if (err) {console.log (err)}
});