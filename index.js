const puppeteer = require('puppeteer')
const fs = require('fs')
const cookies = require('./cookies.json')

require('aws-sdk/lib/maintenance_mode_message').suppress = true
require('dotenv').config()

const email = process.env.EMAIL
const password = process.env.PASSWORD

const userInput = {
    exact: '',
    distance: '',
    condition: '',
    date: '',
    delivery: '',
    availability: '',
    min: '',
    max: ''
}

const exact_param = {
    true: "true",
    false: "false"
}

const distance_param = {
    suggested: "best_match",
    nearestFirst: "distance_ascend",
    newestFirst: "create_time_descend",
    lowestFirst: "price_ascend",
    highestFirst: "price_descend"
}

const condition_param = {
    new: "new",
    usedLikeNew: "used_like_new",
    usedGood: "used_good",
    usedFair: "used_fair"
}

const date_param = {
    one: '1',
    seven: '7',
    thirty: '30'
}

const delievery_param = {
    localPickup: 'local_pick_up',
    shipping: 'shipping'
}

const availability_param = {
    in: 'in%20stock',
    out: 'out%20of%20stock'
}

async function delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function getItem(page) {

    return await page.evaluate( async() => {

        let visited = []
        let totalItems = []

        // get list of items
        const itemList = document.querySelectorAll('div[class="x9f619 x78zum5 x1r8uery xdt5ytf x1iyjqo2 xs83m0k x1e558r4 x150jy0e x1iorvi4 xjkvuk6 xnpuxes x291uyu x1uepa24"]')

        if (itemList) {
            
            itemList.forEach(element => {
    
                try {

                    // item url will be the id of each item
                    const item_url = element.querySelector('a[class="x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1heor9g x1lku1pv"]')
                    const item = {}
    
                    // If the item has not been visited before
                    if (!visited.includes(item_url)) {
                        
                        visited.push(item_url)
    
                        const item_image = element.querySelector('img[class="xt7dq6l xl1xv1r x6ikm8r x10wlt62 xh8yej3"]')
                        const item_title = element.querySelector('span[class="x1lliihq x6ikm8r x10wlt62 x1n2onr6"]')
                        const item_price = element.querySelector('span[class="x193iq5w xeuugli x13faqbe x1vvkbs xlh3980 xvmahel x1n0sxbx x1lliihq x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x4zkp8e x3x7a5m x1lkfr7t x1lbecb7 x1s688f xzsf02u"]')
                        const item_location = element.querySelector('span[class="x1lliihq x6ikm8r x10wlt62 x1n2onr6 xlyipyv xuxw1ft"]')
                        
                        if (item_url) {
                            item.url = item_url.href
                        }
    
                        if (item_image) {
                            item.image = item_image.src
                        }
    
                        if (item_title) {
                            item.title = item_title.textContent
                        }
    
                        if (item_price) {
                            item.price = item_price.textContent
                        }
    
                        if (item_location) {
                            item.location = item_location.textContent
                        }

                        totalItems.push(item)

                    }
    
                } catch (error) {
    
                    console.log('Error getting the item details: ', error)
    
                }

            })  

        }

        return totalItems

    })

}

const main = async () => {  

    // Get location from the user -- needs to be re-implemented later
    const location = '109571329060695'
    const item = 'car'

    let targetCount = 10000

    // URL of facebook marketplace
    const loginURL = 'https://www.facebook.com/login'
    let marketplaceURL = `https://www.facebook.com/marketplace/${encodeURI(location)}/search/?query=${encodeURI(item)}`

    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
    })

    page = await browser.newPage()

    // If we have a previously saved session
    if (Object.keys(cookies).length) {

        // Set the saved cookies in the puppeteer browser page
        await page.setCookie(...cookies)
        await delay(2500)

    } else {

        // Go to facebook login page
        await page.goto(loginURL)

        // Write in the username and password
        await page.type('#email', email, {delay: 30})
        await page.type('#pass', password, {delay: 30})

        await page.click('#loginbutton')
        await page.waitForNavigation()
        await delay(10000)

        // Get current browser page session
        let currentCookies = await page.cookies()

        // Create a cookie file (if not already created) to hold the session
        fs.writeFileSync('./cookies.json', JSON.stringify(currentCookies))
    }

    await page.goto(marketplaceURL)
    await delay(3000)

    // userInput.exact = 'false'
    // userInput.distance = 'nearestFirst'
    // userInput.condition = ['new', 'used_like_new']
    // userInput.min = 1000
    // userInput.max = 5000
    // userInput.date = 'thirty'
    // userInput.delivery = 'localPickup'
    // userInput.availability = 'out'
    
    if (userInput.exact) {
        marketplaceURL += await `&exact=${exact_param[userInput.exact]}`
    }
    
    // distance
    if (userInput.distance) {
        marketplaceURL += await `&sortBy=${distance_param[userInput.distance]}`
    }
    
    // condition
    if (userInput.condition) {
        const conditionFilters = await userInput.condition.map(condition => condition_param[condition])
        marketplaceURL += await `&itemCondition=${conditionFilters.join('%2C')}`
    }

    // availability
    if (userInput.availability) {
        marketplaceURL += await `&availability=${availability_param[userInput.availability]}`
    }

    // date
    if (userInput.date) {
        marketplaceURL += await `&daysSinceListed=${date_param[userInput.date]}`
    }

    // delievery
    if (userInput.delievery) {
        marketplaceURL += await `&deliveryMethod=${delievery_param[userInput.delievery]}`
    }

    // price
    if (userInput.min) {
        marketplaceURL += await `&minPrice=${userInput.min}`
    }

    if (userInput.max) {
        marketplaceURL += await `&maxPrice=${userInput.max}`
    }

    const intervalId = setInterval(async() => {
    
        const totalItems = await getItem(page)
        console.log('total items: ', totalItems)
        
        await delay(1000)

        await page.evaluate(() => {
            const distance = 500
            window.scrollBy(0, distance)
        })

        const isAtBottom = await page.evaluate(() => {
            return window.innerHeight + window.scrollY >= document.body.offsetHeight
        })

        if (isAtBottom || totalItems.length >= targetCount) {
            clearInterval(intervalId)
            await delay(2500)
            await page.close()
            await browser.close()
        }

    }, 1000)

    await delay(10000)
    await page.close()
    await browser.close()

}

main()