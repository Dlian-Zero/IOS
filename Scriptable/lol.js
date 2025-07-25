// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: trophy;
/**
 * @author  SongqianLi
 * @email   mail@lisongqian.cn
 * @datetime    2023-10-9 13:23:16
 * @Description LOL比赛日程小组件v2
 */

// 全局变量声明
const lol_config = {
    version: "2.0.0",
    upgrade: true,
    baseUrl: "http://lpl.lisongqian.cn/",
}

const widget = new ListWidget()
let teamList = {}
let competitionData = {}
let matchType = 0
let presentSize = "large"
let textColor = Color.dynamic(
    Color.black(),
    Color.black()
)
let imageSize = 35
let fontSize = 10
let statusFontSize = 14 // 新增：专门用于状态文本的字体大小
let smallWidget = false
let timeStrWidth = imageSize * 4 // 比赛开始时间的容器宽度，比如："16:00"

let teamWidth = imageSize * 2 // 队伍容器宽度
let teamNameHeight = imageSize * 0.6 // 队名文本大小
let lineWidth = teamWidth * 2 + timeStrWidth + 20  // 分割线长度

/**
 * 参数更新函数
 */
function updateGlobalData() {
    widget.backgroundColor = Color.dynamic(
        Color.white(),
        Color.white()
    )
    widget.setPadding(5, 5, 5, 5)
    if (config.runsInWidget) {
        presentSize = null
    }
    if (config.widgetFamily === "small" || presentSize === "small") {
        imageSize *= 0.8
        fontSize *= 0.8
        statusFontSize *= 0.8 // 小部件时缩小状态字体
        smallWidget = true
    }
    if (smallWidget) {
        lineWidth = teamWidth * 2 + imageSize * 4.5
    }
}

/**
 * 入口函数
 * @returns {Promise<void>}
 */
async function init() {
    if (lol_config.upgrade) {
        await downloadUpdate()
    }

    updateGlobalData()
    try {
        matchType = parseInt(args.widgetParameter.toString(), 10)
    } catch (e) {
        // matchType = 148 // 2021 职业联赛
        // matchType = 156 // 2021 全球总决赛
        // matchType = 184 // 2022 职业联赛
        // matchType = 187 // 解说杯
    }

    teamList = await loadTeamList()
    competitionData = await loadLolCompetitions()

    await renderMatchList();
    if (!config.runsInWidget) {
        if (presentSize === "large") {
            widget.presentLarge()
        } else if (presentSize === "medium") {
            widget.presentMedium()
        } else if (presentSize === "small") {
            widget.presentSmall()
        }
    }
    Script.setWidget(widget)
    Script.complete()
}

await init();


/**
 * 渲染函数
 * @returns {Promise<void>}
 */
async function renderMatchList() {

    let num = 5
    if (config.widgetFamily === "large" || presentSize === "large") {
        num = 5
    } else if (config.widgetFamily === "medium" || presentSize === "medium") {
        num = 2
    } else if (config.widgetFamily === "small" || presentSize === "small") {
        num = 2
    }
    for (var i = 0; i < competitionData.length; i++) {
        let val = competitionData[i]
        if (val.MatchStatus === "1" || val.MatchStatus === "2") // 未开始或进行中
        {
            break
        }
    }

    if (competitionData.length < num) {
        num = competitionData.length
        i = 0
    } else {
        if (i + num - 1 >= competitionData.length) {
            i = competitionData.length - num
        } else if (i > 1) {
            i -= Math.floor(num / 2)
        } else {//有一个比赛进行中 或 都未开始
            i = 0
        }
    }

    let lastGameType = competitionData[i].GameName
    for (let j = 0; j < num; j++) {
        // 比赛和队伍数据
        let val = competitionData[i + j]
        let team1 = teamList[val.TeamA] // 队伍1
        let team2 = teamList[val.TeamB] // 队伍2

        let gameType = val.GameName
        if (j === 0 || lastGameType !== gameType) {
            addDivider(gameType, lineWidth, 12)
            lastGameType = gameType
        } else {
            addDividerLine(widget, lineWidth, 6, new Color("#909399"))
        }
        let lineStack = widget.addStack()
        lineStack.size = new Size(lineWidth, imageSize + teamNameHeight)
        lineStack.centerAlignContent()

        let team1Logo = await getImageByUrl(team1.TeamLogo)
        let team2Logo = await getImageByUrl(team2.TeamLogo)
        team1.score = val.ScoreA
        team2.score = val.ScoreB

        // 队伍1
        addTeam(lineStack, team1.TeamName, team1Logo)

        // 比赛状态
        addStatus(lineStack, team1, team2, val)

        // 队伍2
        addTeam(lineStack, team2.TeamName, team2Logo)
    }
    addDividerLine(widget, lineWidth, 6, textColor)
}

function addTeam(rootStack, teamName, logo) {
    let teamStack = rootStack.addStack()
    teamStack.size = new Size(teamWidth, imageSize + fontSize)
    teamStack.layoutVertically()
    teamStack.centerAlignContent() // 垂直居中
    let teamImgStack = teamStack.addStack()
    teamImgStack.size = new Size(teamWidth, imageSize)
    teamImgStack.addImage(logo)
    let teamTxtStack = teamStack.addStack();//文字水平居中
    teamTxtStack.centerAlignContent()
    teamTxtStack.size = new Size(teamWidth, fontSize)
    let teamtext = teamTxtStack.addText(teamName)
    teamtext.textColor = textColor
    teamtext.font = Font.semiboldSystemFont(fontSize)
}

function addStatus(rootStack, team1, team2, val) {
    // 比分
    let scoreStack = rootStack.addStack()
    scoreStack.layoutVertically()
    scoreStack.centerAlignContent()
    scoreStack.size = new Size(timeStrWidth, imageSize + teamNameHeight)
    scoreStack.setPadding(20, 0, 10, 0)
    let status = val.MatchStatus
    if (status === "1") {
        // const vsTxt = scoreTopStack.addText("VS")
        // vsTxt.centerAlignText()
        // vsTxt.font = Font.lightMonospacedSystemFont(imageSize * 0.8)
        // // vsTxt.textColor = new Color(fontColor, 1)
        // vsTxt.textColor = textColor
        // let statusTxt = scoreBottomStack.addText("未开始")
        // statusTxt.centerAlignText()
        // statusTxt.font = Font.mediumSystemFont(fontSize)
        // // statusTxt.textColor = textColor
        // statusTxt.textColor = textColor

        // 时间
        let matchTime = new Date(val.MatchDate.replace(/-/g, "/"))

        let timeStr = dateFormat("HH:MM", matchTime)
        let dateStr = dateFormat("mm-dd", matchTime)
        let today = new Date()
        if (matchTime.getMonth() === today.getMonth()) {
            if (matchTime.getDay() === today.getDay() + 1) {
                dateStr = "明天"
            } else if (matchTime.getDay() === today.getDay() + 2) {
                dateStr = "后天"
            }
        }

        let timeStrStack = scoreStack.addStack()
        timeStrStack.centerAlignContent()
        timeStrStack.size = new Size(timeStrWidth, imageSize)
        let timeStrTxt = timeStrStack.addText(dateStr + " " + timeStr)
        timeStrTxt.font = Font.semiboldSystemFont(fontSize)
        timeStrTxt.textColor = textColor

        let proGameTypeStack = scoreStack.addStack()
        proGameTypeStack.centerAlignContent()
        proGameTypeStack.size = new Size(timeStrWidth, imageSize * 0.6)
        let gameTypeStr = val.GameTypeName + '-' + val.GameProcName + '-' + val.GameModeName
        let proGameTypeStrTxt = proGameTypeStack.addText(gameTypeStr)
        proGameTypeStrTxt.font = Font.regularSystemFont(fontSize)
        proGameTypeStrTxt.textColor = new Color("#444444")

    } else {
        let scoreTopStack = scoreStack.addStack()
        scoreTopStack.size = new Size(timeStrWidth, imageSize)
        let scoreBottomStack = scoreStack.addStack()
        scoreBottomStack.size = new Size(timeStrWidth, teamNameHeight)
        const team1ScoreStack = scoreTopStack.addStack()
        const scoreDividerStack = scoreTopStack.addStack()
        const team2ScoreStack = scoreTopStack.addStack()
        team1ScoreStack.size = new Size(imageSize * 0.8, imageSize)
        team1ScoreStack.backgroundColor = new Color("#3b3b3b")
        team1ScoreStack.cornerRadius = 5

        scoreDividerStack.size = new Size(imageSize * 0.4, imageSize)
        scoreDividerStack.setPadding(0, 0, 2, 0)

        team2ScoreStack.size = new Size(imageSize * 0.8, imageSize)
        team2ScoreStack.backgroundColor = new Color("#3b3b3b")
        team2ScoreStack.cornerRadius = 5

        const team1ScoreTxt = team1ScoreStack.addText(team1.score.toString())
        team1ScoreTxt.centerAlignText()
        team1ScoreTxt.font = Font.semiboldSystemFont(imageSize * 0.8)
        team1ScoreTxt.textColor = Color.white()

        const scoreDividerTxt = scoreDividerStack.addText(":")
        team1ScoreTxt.centerAlignText()
        scoreDividerTxt.font = Font.semiboldSystemFont(imageSize * 0.8)
        // scoreDividerTxt.textColor = new Color(fontColor, 1)
        scoreDividerTxt.textColor = textColor


        const team2ScoreTxt = team2ScoreStack.addText(team2.score.toString())
        team2ScoreTxt.centerAlignText()
        team2ScoreTxt.font = Font.semiboldSystemFont(imageSize * 0.8)
        team2ScoreTxt.textColor = Color.white()

        if (status === "3") {
            if (team1.score > team2.score) {
                team1ScoreTxt.textColor = new Color("#0febc1")
            } else if (team1.score < team2.score) {
                team2ScoreTxt.textColor = new Color("#0febc1")
            }
        }
        let statusTxt = status === "2" ? scoreBottomStack.addText("进行中") : scoreBottomStack.addText("已结束")
        statusTxt.centerAlignText()
        statusTxt.font = Font.mediumSystemFont(statusFontSize) // 修改为使用新的状态字体大小
        statusTxt.textColor = textColor
    }
}

/***********************************************************
 * 以下为相关操作函数
 **********************************************************/

/**
 * url转换
 * @param url
 * @returns {string}
 */
function convertUrl(url) {
    let urlList = url.split("//")[1].split("/")
    // urlList.splice(0, 1)
    // return baseUrl + urlList.join("/")
    return "http://" + urlList.join("/")
}

/**
 * 获取队伍列表
 * @returns {Promise<any>}
 */
async function loadTeamList() {
    const req = new Request(
        lol_config.baseUrl + "teamlist.php"
    )
    return req.loadJSON().then(res => {
        if (res.status == 0) {
            let newTeamList = {}
            for (let key in res.msg) {
                newTeamList[res.msg[key].TeamId] = res.msg[key]
            }
            return newTeamList
        } else
            return {}
    })
}

/**
 * 加载赛事数据
 * @returns {Promise<any>}
 */
async function loadLolCompetitions() {
    // "http://lpl.lisongqian.cn/web201612/data/LOL_MATCH2_MATCH_HOMEPAGE_BMATCH_LIST.js" //全部
    let url = "http://lpl.lisongqian.cn/web201612/data/LOL_MATCH2_MATCH_HOMEPAGE_BMATCH_LIST_" + matchType + ".js"
    if (matchType === 0) {
        url = "http://lpl.lisongqian.cn/default.php"
    }
    const req = new Request(url)
    return req.loadJSON().then(res => {
        if (res.status == 0)
            return res.msg
        return []
    })
}

/**
 * 图片缓存到本地
 * @param {string} imageUrl : 图片URL
 */
async function loadImage(imageUrl) {
    const fm = FileManager.local()
    let splitList = imageUrl.split("//")[1].split("/")
    const path = fm.documentsDirectory() + splitList[splitList.length - 2]

    const temp = imageUrl.split("/")
    const filename = temp[temp.length - 1]
    fm.createDirectory(path.split(filename)[0], true)
    if (!fm.fileExists(path)) {
        const img = await new Request(imageUrl).loadImage()
        fm.writeImage(path, img)
        return img
    } else {
        return fm.readImage(path)
    }
}

/**
 * 获取图片并缓存
 * @param url 图片url
 * @param useCache 是否缓存图片
 * @returns {Promise<*|*>}
 */
async function getImageByUrl(url, useCache = true) {
    url = convertUrl(url)
    const cacheKey = md5(url)
    const cacheFile = FileManager.local().joinPath(FileManager.local().temporaryDirectory(), cacheKey)
    // 判断是否有缓存
    if (useCache && FileManager.local().fileExists(cacheFile)) {
        return Image.fromFile(cacheFile)
    }
    try {
        const img = await new Request(url).loadImage()
        // 存储到缓存
        FileManager.local().writeImage(cacheFile, img)
        return img
    } catch (e) {
        console.log(e)
        // 没有缓存+失败情况下，返回自定义的绘制图片（红色背景）
        let ctx = new DrawContext()
        ctx.size = new Size(100, 100)
        ctx.setFillColor(Color.red())
        ctx.fillRect(new Rect(0, 0, 100, 100))
        return await ctx.getImage()
    }
}

function md5(str) {
    function d(n, t) {
        var r = (65535 & n) + (65535 & t);
        return (n >> 16) + (t >> 16) + (r >> 16) << 16 | 65535 & r
    }

    function f(n, t, r, e, o, u) {
        return d((c = d(d(t, n), d(e, u))) << (f = o) | c >>> 32 - f, r);
        var c, f
    }

    function l(n, t, r, e, o, u, c) {
        return f(t & r | ~t & e, n, t, o, u, c)
    }

    function v(n, t, r, e, o, u, c) {
        return f(t & e | r & ~e, n, t, o, u, c)
    }

    function g(n, t, r, e, o, u, c) {
        return f(t ^ r ^ e, n, t, o, u, c)
    }

    function m(n, t, r, e, o, u, c) {
        return f(r ^ (t | ~e), n, t, o, u, c)
    }

    function i(n, t) {
        var r, e, o, u;
        n[t >> 5] |= 128 << t % 32, n[14 + (t + 64 >>> 9 << 4)] = t;
        for (var c = 1732584193, f = -271733879, i = -1732584194, a = 271733878, h = 0; h < n.length; h += 16) c = l(r = c, e = f, o = i, u = a, n[h], 7, -680876936), a = l(a, c, f, i, n[h + 1], 12, -389564586), i = l(i, a, c, f, n[h + 2], 17, 606105819), f = l(f, i, a, c, n[h + 3], 22, -1044525330), c = l(c, f, i, a, n[h + 4], 7, -176418897), a = l(a, c, f, i, n[h + 5], 12, 1200080426), i = l(i, a, c, f, n[h + 6], 17, -1473231341), f = l(f, i, a, c, n[h + 7], 22, -45705983), c = l(c, f, i, a, n[h + 8], 7, 1770035416), a = l(a, c, f, i, n[h + 9], 12, -1958414417), i = l(i, a, c, f, n[h + 10], 17, -42063), f = l(f, i, a, c, n[h + 11], 22, -1990404162), c = l(c, f, i, a, n[h + 12], 7, 1804603682), a = l(a, c, f, i, n[h + 13], 12, -40341101), i = l(i, a, c, f, n[h + 14], 17, -1502002290), c = v(c, f = l(f, i, a, c, n[h + 15], 22, 1236535329), i, a, n[h + 1], 5, -165796510), a = v(a, c, f, i, n[h + 6], 9, -1069501632), i = v(i, a, c, f, n[h + 11], 14, 643717713), f = v(f, i, a, c, n[h], 20, -373897302), c = v(c, f, i, a, n[h + 5], 5, -701558691), a = v(a, c, f, i, n[h + 10], 9, 38016083), i = v(i, a, c, f, n[h + 15], 14, -660478335), f = v(f, i, a, c, n[h + 4], 20, -405537848), c = v(c, f, i, a, n[h + 9], 5, 568446438), a = v(a, c, f, i, n[h + 14], 9, -1019803690), i = v(i, a, c, f, n[h + 3], 14, -187363961), f = v(f, i, a, c, n[h + 8], 20, 1163531501), c = v(c, f, i, a, n[h + 13], 5, -1444681467), a = v(a, c, f, i, n[h + 2], 9, -51403784), i = v(i, a, c, f, n[h + 7], 14, 1735328473), c = g(c, f = v(f, i, a, c, n[h + 12], 20, -1926607734), i, a, n[h + 5], 4, -378558), a = g(a, c, f, i, n[h + 8], 11, -2022574463), i = g(i, a, c, f, n[h + 11], 16, 1839030562), f = g(f, i, a, c, n[h + 14], 23, -35309556), c = g(c, f, i, a, n[h + 1], 4, -1530992060), a = g(a, c, f, i, n[h + 4], 11, 1272893353), i = g(i, a, c, f, n[h + 7], 16, -155497632), f = g(f, i, a, c, n[h + 10], 23, -1094730640), c = g(c, f, i, a, n[h + 13], 4, 681279174), a = g(a, c, f, i, n[h], 11, -358537222), i = g(i, a, c, f, n[h + 3], 16, -722521979), f = g(f, i, a, c, n[h + 6], 23, 76029189), c = g(c, f, i, a, n[h + 9], 4, -640364487), a = g(a, c, f, i, n[h + 12], 11, -421815835), i = g(i, a, c, f, n[h + 15], 16, 530742520), c = m(c, f = g(f, i, a, c, n[h + 2], 23, -995338651), i, a, n[h], 6, -198630844), a = m(a, c, f, i, n[h + 7], 10, 1126891415), i = m(i, a, c, f, n[h + 14], 15, -1416354905), f = m(f, i, a, c, n[h + 5], 21, -57434055), c = m(c, f, i, a, n[h + 12], 6, 1700485571), a = m(a, c, f, i, n[h + 3], 10, -1894986606), i = m(i, a, c, f, n[h + 10], 15, -1051523), f = m(f, i, a, c, n[h + 1], 21, -2054922799), c = m(c, f, i, a, n[h + 8], 6, 1873313359), a = m(a, c, f, i, n[h + 15], 10, -30611744), i = m(i, a, c, f, n[h + 6], 15, -1560198380), f = m(f, i, a, c, n[h + 13], 21, 1309151649), c = m(c, f, i, a, n[h + 4], 6, -145523070), a = m(a, c, f, i, n[h + 11], 10, -1120210379), i = m(i, a, c, f, n[h + 2], 15, 718787259), f = m(f, i, a, c, n[h + 9], 21, -343485551), c = d(c, r), f = d(f, e), i = d(i, o), a = d(a, u);
        return [c, f, i, a]
    }

    function a(n) {
        for (var t = "", r = 32 * n.length, e = 0; e < r; e += 8) t += String.fromCharCode(n[e >> 5] >>> e % 32 & 255);
        return t
    }

    function h(n) {
        var t = [];
        for (t[(n.length >> 2) - 1] = void 0, e = 0; e < t.length; e += 1) t[e] = 0;
        for (var r = 8 * n.length, e = 0; e < r; e += 8) t[e >> 5] |= (255 & n.charCodeAt(e / 8)) << e % 32;
        return t
    }

    function e(n) {
        for (var t, r = "0123456789abcdef", e = "", o = 0; o < n.length; o += 1) t = n.charCodeAt(o), e += r.charAt(t >>> 4 & 15) + r.charAt(15 & t);
        return e
    }

    function r(n) {
        return unescape(encodeURIComponent(n))
    }

    function o(n) {
        return a(i(h(t = r(n)), 8 * t.length));
        var t
    }

    function u(n, t) {
        return function (n, t) {
            var r, e, o = h(n), u = [], c = [];
            for (u[15] = c[15] = void 0, 16 < o.length && (o = i(o, 8 * n.length)), r = 0; r < 16; r += 1) u[r] = 909522486 ^ o[r], c[r] = 1549556828 ^ o[r];
            return e = i(u.concat(h(t)), 512 + 8 * t.length), a(i(c.concat(e), 640))
        }(r(n), r(t))
    }

    function t(n, t, r) {
        return t ? r ? u(t, n) : e(u(t, n)) : r ? o(n) : e(o(n))
    }

    return t(str)
}

/**
 * 获取周（周一、周二、周三....）
 * @param {Date} date :
 */
function getDay(date) {
    const dayMap = {
        0: "周日",
        1: "周一",
        2: "周二",
        3: "周三",
        4: "周四",
        5: "周五",
        6: "周六"
    }
    return dayMap[date.getDay()]
}

/**
 * 时间格式化
 * @param {string} fmt :模板字符串 : "YYYY-mm-dd HH:MM"
 * @param {Date} date :Date对象
 */
function dateFormat(fmt, date) {
    let ret;
    const opt = {
        "Y+": date.getFullYear().toString(), // 年
        "m+": (date.getMonth() + 1).toString(), // 月
        "d+": date.getDate().toString(), // 日
        "H+": date.getHours().toString(), // 时
        "M+": date.getMinutes().toString(), // 分
        "S+": date.getSeconds().toString() // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length === 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")));
        }
    }
    return fmt;
}

/**
 * 渲染日期分割线左右侧的线条
 * @param {*} dividerStack : 分割线容器
 * @param {*} dividerLineWidth : 分割线宽度
 * @param {*} dividerLineHeight : 分割线高度
 * @param {Color} dividerLineColor : 分割线颜色
 */
function addDividerLine(dividerStack, dividerLineWidth, dividerLineHeight, dividerLineColor) {
    const sideDividerStack = dividerStack.addStack()
    sideDividerStack.size = new Size(dividerLineWidth, dividerLineHeight)
    sideDividerStack.layoutVertically()
    sideDividerStack.centerAlignContent()
    const sideDivider = sideDividerStack.addStack()
    sideDivider.size = new Size(dividerLineWidth, 1)
    sideDivider.backgroundColor = dividerLineColor
}

/**
 * 渲染日期分割线
 * @param {string} text : 分隔符显示的文字
 * @param {number} dividerWidth : 分割线总宽度
 * @param {number} dividerHeight : 分割线高度
 */
function addDivider(text, dividerWidth, dividerHeight) {
    let txtFontSize = dividerHeight - 1
    let dividerTxtWidth = text.length * txtFontSize  // 文本长度
    let dividerLineWidth = (dividerWidth - dividerTxtWidth) / 2

    const dividerStack = widget.addStack()
    dividerStack.size = new Size(dividerWidth, dividerHeight)
    // 渲染左侧分割线
    addDividerLine(dividerStack, dividerLineWidth, dividerHeight, textColor)
    // 日期文本容器
    const dividerTxtStack = dividerStack.addStack()
    // 渲染右侧分割线
    addDividerLine(dividerStack, dividerLineWidth, dividerHeight, textColor)
    // 渲染日期文本
    dividerTxtStack.size = new Size(dividerTxtWidth, dividerHeight)
    const dividerTxt = dividerTxtStack.addText(text)
    dividerTxt.font = Font.lightMonospacedSystemFont(txtFontSize)
    dividerTxt.textColor = textColor
}

/**
 * 下载更新
 * @returns {Promise<void>}
 */
async function downloadUpdate() {
    const r = new Request("http://lpl.lisongqian.cn/version.php?type=lol")
    const lastVersion = await r.loadString()
    if (lastVersion > lol_config.version) {
        let files = FileManager.local()
        const iCloudInUse = files.isFileStoredIniCloud(module.filename)
        files = iCloudInUse ? FileManager.iCloud() : files
        let downloadURL = "https://cdn.jsdelivr.net/gh/lisongqian/Scriptable@" + lastVersion + "/lol.js"
        try {
            const req = new Request(downloadURL)
            const codeString = await req.loadString()
            files.writeString(module.filename, codeString)
            console.log("更新成功")
        } catch {
            console.log("更新失败，downloadURL:" + downloadURL)
        }
    }
}
