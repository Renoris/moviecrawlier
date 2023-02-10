const fs = require('fs');
const {movie} = require('./models/index');
const cheerio = require('cheerio');
const axios = require('axios');
const sequelize = require('sequelize')
const {clientId, clientSecret} = require('./secret');
const XLSX = require("xlsx")
const countries = ['FR', 'GB', 'HK', 'JP', 'KR', 'US', 'ETC'];
const url = "https://openapi.naver.com/v1/search/movie.json";
const genreies = ['TV영화','드라마','판타지','서부','공포','로맨스','모험','스릴러','느와르','컬트','다큐멘터리','코미디','가족','미스터리','전쟁','애니메이션','범죄','뮤지컬','SF','액션','무협','에로','서스펜스','서사','블랙코미디','실험','영화카툰','영화음악','영화패러디포스터'];

const queries = fs.readFileSync('/Users/applet/desktop/hangulFinish.txt', 'utf8');
// const queries = '의더';
// const yearfrom = [1981, 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021];
// const yearto = [1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025];
const display = 100;
let insertCount = 0;
let cancelCount = 0;
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
        return src.replaceAll("\n", "");
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

function resolveOutLine($) {
    const infos = []; // [나라, 장르, 러닝타임, 개봉일]
    $('.info_spec > dd > p > span').each((index, element) => {
        const item = removeBlink($(element).text());
        let flag = true;

        if (flag) {
            if (item.includes('분')) {
                infos[2] = item;
                flag = false;
            }
        }

        if (flag) {
            if (item.includes('개봉')) {
                infos[3] = item;
                flag = false;
            }
        }

        if (flag) {
            for (const genre of genreies) {
                if (item.includes(genre)) {
                    if (infos[1] === undefined) {
                        infos[1] = genre;
                    } else {
                        infos[1] = `${infos[1]}, ${genre}`
                    }
                    flag = false;
                }
            }
        }

        if (flag) {
            if (infos[0] === undefined) {infos[0] = `${item}`}
            else {infos[0] = `${infos[0]}, ${item}`}
        }


    })


    return infos;
}

function resolveStory($) {
    return $('.con_tx').text();
}

function resolveGrade($) {
    const tag = $('.info_spec');
    let flag = false;
    tag.each((idx, item) => {
        if (!flag) {
            if ($(item).className === 'step4'){
                flag = true;
            }
        } else {
            const $item = cheerio.load(item);
            return $item('p > a').val();
        }
    })
}

/**
 *
 * @param str : string
 */
function abbreviateHuman(str) {
    if (str.length > 10) {
        str = str.slice(0, str.indexOf(',', 10));
        return `${str} 등`
    }
    return str;
}

/**
 * @param url : string
 * ['장르', '국가', '러닝타임', '개봉일자(안씀)']
 */
async function crawlingMovieData(url) {
    const infoHtml = await axios.get(url);
    const $ = cheerio.load(infoHtml.data);
    const story = resolveStory($);
    const imageSrc = resolveImageSrc($, url);
    const outLine = resolveOutLine($); // [나라, 장르, 러닝타임, 개봉일]
    return {
        story,
        imageSrc,
        outLine
    };
}

async function isExistMovie(title, director, pubDate) {
    return await movie.findOne({
        where: {
            pub_date : sequelize.where(sequelize.fn('YEAR', sequelize.col('pub_date')), Number(pubDate)),
            director : director,
            title : title
        }
    });
}

/**
 * @param item naverApiMovieItem
 * @param title : string
 * @param director : string
 * @returns {Promise<MovieData>}
 */
async function createMovieData(item, title, director) {
    const infoLink = item.link;
    const infos = await crawlingMovieData(infoLink);
    return new MovieData(
        title,
        removeBold(item.subTitle),
        new Date(Number(item.pubDate), 0, 1),
        infos.story,
        infos.outLine[1], //장르
        infos.outLine[0], //나라
        infos.outLine[2], //러닝타임
        infoLink,
        infos.imageSrc,
        director,
        abbreviateHuman(removeOr(removeBold(item.actor))),
        removeOr(removeBold(item.userRating))
    )
}

async function insertMovieData(data) {
    movie.create(data);
}

function sleep(ms) {
    const wakeUpTime = Date.now() + ms;
    while (Date.now() < wakeUpTime) {
    }
}

function validateResponse(response, yearfrom, yearto, query, country) {
    if (response?.data?.items === undefined) {
        console.log(`yearfrom:${yearfrom}, yearto: ${yearto}, query:${query}`+ ((country) ? `country:${country}` : ``) +`를 조회하지 못했습니다. `);
        return true;
    }

    if (response.data.total === 0) {
        console.log(`yearfrom:${yearfrom}, yearto: ${yearto}, query:${query}`+ ((country) ? `country:${country}` : ``) +`의 영화 정보가 없습니다.`);
        return true;
    }

    return false;
}

async function getNaverApi (params) {
    return await axios.get(url,
        {
            params: params,
            headers: {'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret}
        }
    );
}

async function buildData(items, index) {
    const promises = items.map(async (item) => {
        const title = removeBold(item.title);
        try {
            const director = abbreviateHuman(removeOr(removeBold(item.director)));
            console.log(`가져오는 중 ${index} : ${item.title}`)
            const innerIndex = index;
            index++;

            if (!await isExistMovie(title, director, item.pubDate)) {
                sleep(100);
                const movieData = await createMovieData(item, title, director);
                await insertMovieData(movieData)
                insertCount++;
                console.log(`저장됨 ${innerIndex} : ${item.title}`);
            } else {
                cancelCount++;
                console.log(`이미 존재함 ${innerIndex} : ${item.title}`);
            }
        } catch (error) {
            console.log(error);
            console.log(`영화정보 가져오기 실패 : ${item.title}`);
            fs.appendFileSync('/Users/applet/desktop/crawlingerrorlog.txt', `${title}\n`, (err) => {

            });
        }
        index++;
    })
    await Promise.all(promises);
}

async function distributeCountryMovieSearch (yearfrom, yearto, query) {
    for (const country of countries) {
        let total = 0;
        let start = 1;
        do {
            sleep(50);
            const params = {query, display, yearto, yearfrom, start, country}; // country추가
            const response = await getNaverApi(params);

            if (validateResponse(response, yearfrom, yearto, query, country)) {
                continue;
            }

            total = response.data.total;
            const log = `yearfrom:${yearfrom}, yearto: ${yearto}, query:${query}의 조회, country : ${country} 영화량 : ${total}`;
            fs.appendFileSync('/Users/applet/desktop/crawlinglog.txt', `${log}\n`, (err) => {
                if (err) {
                    console.log(err)
                }
            });

            console.log(log);
            const items = response.data.items;
            await buildData(items, start);

            if (start === 1000) {
                break;
            }
            start += 100;
            if (start > 1000) {
                start = 1000;
            }
        } while (total > start);
    }
}

async function apiUse() {
    for (let year = 1980; year <= 2023; year += 3) {
        for (const query of queries) {
            let total = 0;
            let start = 1;
            const yearto = year + 2;
            const yearfrom = year;
            do {
                sleep(200);
                const params = {query, display, yearto, yearfrom, start};
                const response = await getNaverApi(params);

                if (validateResponse(response, yearfrom, yearto, query)) {
                    continue;
                }

                total = response.data.total;
                const log = `yearfrom:${yearfrom}, yearto: ${yearto}, query:${query}의 조회, 영화량 : ${total}`;
                console.log(log);

                //만약 검색결과가 1100개가 넘는다면 그때는 나라별 검색 분기
                if (total > 1000) {
                    console.log(`많은 검색량이 조회되어 나라별 분기로 전환: ${total}`)
                    await distributeCountryMovieSearch(yearfrom, yearto, query);
                    fs.appendFileSync('/Users/applet/desktop/crawlinglog.txt', `${log}\n`, (err) => {
                        if (err) {
                            console.log(err)
                        }
                    });
                    break;
                }

                const items = response.data.items;
                await buildData(items, start);

                if (start === 1000) {
                    break;
                }

                start += 100;

                if (start > 1000) {
                    start = 1000;
                }

            } while (total > start);
        }
    }

    console.log(`삽입된 영화 ${insertCount}개`);
    console.log(`중복된 영화 ${cancelCount}개`);
}

apiUse();
// async function reCrawling () {
//     const total = 76398;
//     let offset = 0;
//     while (offset < total) {
//         console.log(`조회중 : offset : ${offset}`);
//         const array = await movie.findAll({
//             offset,
//             limit : 100
//         });
//         offset += 100;
//
//         const promises = array.map(async (item) => {
//             sleep(50);
//             axios.get(item.link);
//         })
//     }
// }

// async function testApi () {
//     const file = XLSX.readFile('movieList.xls');
//     const worksheet = file.Sheets["영화정보 리스트"];
//     const worksheet2 = file.Sheets["영화정보 리스트_2"];
//     let datas = [];
//     const sheet1column = 65532;
//     const sheet2column = 28645;
//
//     for(let i = 64903; i <= sheet1column; i++){
//         let obj = {
//             title: worksheet["A" + i].w.replaceAll(" ", ""),
//             subTitle: worksheet["B" + i].w,
//             pubDate: worksheet["C" + i].w.replaceAll(" ", ""),
//             country: worksheet["D" + i].w,
//             genre: worksheet["F" + i].w,
//         }
//         datas.push(obj);
//     }
//
//     for(let i = 1; i <= sheet2column; i++){
//         let obj = {
//             title: worksheet2["A" + i].w.replaceAll(" ", ""),
//             subTitle: worksheet2["B" + i].w,
//             pubDate: worksheet2["C" + i].w.replaceAll(" ", ""),
//             country: worksheet2["D" + i].w,
//             genre: worksheet2["F" + i].w,
//         }
//         datas.push(obj);
//     }
//
//     let index1 = 1;
//     for (const item of datas) {
//         console.log(`${index1} 번째 영화 수정중`);
//         index1++;
//         console.log (item);
//
//         await movie.update({
//             country : item.country,
//             genre : item.genre,
//             },
//             {where: {
//                 pub_date : sequelize.where(sequelize.fn('YEAR', sequelize.col('pub_date')), Number(item.pubDate)),
//                 title : sequelize.where(sequelize.fn('REPLACE', 'title', " ", ""), item.title)
//             }
//         });
//     }
// }
