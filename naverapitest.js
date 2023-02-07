const fs = require('fs');
const {movie} = require('./models/index');
const cheerio = require('cheerio');
const axios = require('axios');
const sequelize = require('sequelize')
const Op = sequelize.Op
const {clientId, clientSecret} = require('secret');
class MovieData {
    constructor(title, subTitle, pubDate, story, genre, country, running_time, link, image, director, actor, userRating) {
        this.title = title;
        this.subTitle = subTitle;
        this.pubDate = pubDate;
        this.story = story;
        this.genre = genre;
        this.country = country;
        this.runningTime = running_time;
        this.link = link;
        this.image = image;
        this.director = director;
        this.actor = actor;
        this.userRating = userRating;
    }
}

/**
 * @param str : string
 */
function removeQuery(str) {
    if (str) {
        const index = str.indexOf('?');
        return str.slice(0, index);
    } else {
        return "-";
    }
}

/**
 * @param src : string
 */
function removeBlink(src) {
    if (src) {
        src = src.replaceAll("\t", "");
        return  src.replaceAll("\n", "");
    } else {
        return "-";
    }
}
/**
 * @param str : string
 */
function removeBold(str) {
    if (str) {
        str = str.replaceAll("<b>", "");
        return str.replaceAll("</b>", "");
    } else {
        return "-";
    }
}

/**
 * @param str : string
 */
function removeOr(str) {
    if (str) {
        str = str.replaceAll("|", ", ");
        return str.slice(0, str.lastIndexOf(","));
    } else {
        return "-";
    }
}

function resolveImageSrc($) {
    let src = "https://ssl.pstatic.net/static/movie/2012/06/dft_img.png";
    const tag = $('.poster > a > img').attr();
    if (tag) {
        src = removeQuery(tag.src);
    }
    return src;
}

function resolveOutLine ($) {
    const infos = []; // 장르, 국가, 러닝타임, 개봉일자(안씀)
    $('.info_spec > dd > p > span').each((index, element) => {
        infos[index] = removeBlink($(element).text());
    })
    if (infos[1] === 'TV영화') {
        infos[0] = `${infos[0]}, TV영화`;
        infos[1] = infos[2];
        infos[2] = infos[3];
        infos.pop();
    }
    return infos;
}

function resolveStory ($) {
    return $('.con_tx').text();
}

/**
 *
 * @param str : string
 */
function abbreviateHuman (str) {
    if (str.length > 10) {
        str = str.slice(0, str.indexOf(',', 10));
        return `${str} 등`
    }
    return str;
}

// function resolveDate(str, pubYear) {
//     if(str) {
//         str = str.replaceAll("개봉", "");
//         str = str.replaceAll(" ", "");
//         const array = str.split(".");
//         return new Date(Number(array[0]), Number(array[1]), Number(array[2]));
//     } else {
//         return new Date(Number(pubYear), 0, 1);
//     }
// }
/**
 * @param url : string
 * ['장르', '국가', '러닝타임', '개봉일자(안씀)']
 */
async function crawlingMovieData(url) {
    const infoHtml = await axios.get(url);
    const $ = cheerio.load(infoHtml.data);
    const story = resolveStory($);
    const imageSrc = resolveImageSrc($,url);
    const outLine = resolveOutLine($);
    return {
        story,
        imageSrc,
        outLine
    };
}

async function isExistMovie(title, director, pubDate) {
     return await movie.findOne({where: {title: title, director: director,
             [Op.and]:sequelize.where(sequelize.fn('YEAR', sequelize.col('pub_date')), Number(pubDate))}});
}
/**
 * @param item naverApiMovieItem
 * @returns {Promise<MovieData>}
 */
async function createMovieData (item) {
    const infoLink = item.link;
    const infos = await crawlingMovieData(infoLink);

    return new MovieData (
        removeBold(item.title),
        removeBold(item.subTitle),
        new Date(item.pubDate, 0, 1),
        infos.story,
        infos.outLine[0],
        infos.outLine[1],
        infos.outLine[2],
        infoLink,
        infos.imageSrc,
        abbreviateHuman(removeOr(removeBold(item.director))),
        abbreviateHuman(removeOr(removeBold(item.actor))),
        removeOr(removeBold(item.userRating))
    )
}

async function insertMovieData(data) {
    movie.create(data);
}

function sleep(ms) {
    const wakeUpTime = Date.now() + ms;
    while (Date.now() < wakeUpTime) {}
}

function validateResponse(response, yearfrom, yearto, query, country) {
    if (response?.data?.items === undefined){
        console.log(`yearfrom:${yearfrom}, yearto: ${yearto}, query:${query}, country:${country} 를 조회하지 못했습니다. `);
        return true;
    }

    if (response.data.total === 0) {
        console.log(`yearfrom:${yearfrom}, yearto: ${yearto}, query:${query}, country:${country}의 영화 정보가 없습니다.`);
        return true;
    }

    return false;
}
async function apiUse() {
    let insertCount = 0;
    let cancelCount = 0;
    const url = "https://openapi.naver.com/v1/search/movie.json";
    const queries = fs.readFileSync('/Users/applet/desktop/hangulFinish.txt', 'utf8');

    const display = 100;
    // const yearfrom = [1981, 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021];
    // const yearto = [1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025];
    const countries = ['FR','GB','HK','JP','KR','US','ETC'];

    for (let i = 1980; i <= 2023; i=i+2) {
        for (const country of countries) {
            for (const query of queries) {
                let total = 0;
                let start = 1;
                do{
                    sleep(50);
                    const response = await axios.get(url,
                        {
                        params : {query, display, yearto: i+1, yearfrom : i, start, country},
                        headers : {'X-Naver-Client-Id' : clientId, 'X-Naver-Client-Secret' : clientSecret}}
                    );

                    if (validateResponse(response, i, i+1, query, country)){
                        continue;
                    }

                    total = response.data.total;
                    const items = response.data.items;

                    for (let item of items) {
                        try {
                            const title = removeBold(item.title);
                            const director = abbreviateHuman(removeOr(removeBold(item.director)));

                            console.log(`가져오는 중 : ${item.title}`)
                            if (!await isExistMovie(title, director, item.pubDate)) {
                                const movieData = await createMovieData(item);
                                await insertMovieData(movieData)
                                insertCount++;
                                console.log(`저장됨 : ${item.title}`);
                            } else {
                                cancelCount++;
                                console.log(`이미 존재함 : ${item.title}`);
                            }
                        } catch (error) {
                            console.log(error);
                            console.log(`영화정보 가져오기 실패 : ${item.title}`);
                        }
                    }
                    start += 100;
                    if (start > 1000) {start = 1000;}
                } while (total > start && start <= 1000);
            }
        }
    }

    console.log(`삽입된 영화 ${insertCount}개`);
    console.log(`중복된 영화 ${cancelCount}개`);
}
apiUse();
