import { Actor } from 'apify';
import { chromium } from 'playwright';

const BASE_URL = 'https://www.reed.co.uk';

async function scrapeJobListings(page, maxResults) {
    const jobs = [];
    let currentPage = 1;
    
    while (jobs.length < maxResults) {
        console.log(`Scraping page ${currentPage}, collected ${jobs.length}/${maxResults} jobs`);
        
        // Wait for job cards to load (try different selectors)
        await page.waitForSelector('article, div[data-qa*="job"], .job-card', { timeout: 30000 });
        await page.waitForTimeout(2000);
        
        // Extract job data from current page
        const pageJobs = await page.evaluate(() => {
            // Try multiple selector strategies
            let jobCards = document.querySelectorAll('article[id^="job-card"]');
            if (!jobCards.length) jobCards = document.querySelectorAll('article');
            if (!jobCards.length) jobCards = document.querySelectorAll('[data-qa*="job"]');
            
            const results = [];
            
            jobCards.forEach(card => {
                try {
                    // Generic selector strategy - find links and text within card
                    const allLinks = card.querySelectorAll('a');
                    const headings = card.querySelectorAll('h1, h2, h3');
                    const allText = card.innerText || '';
                    
                    // Find job title (usually first heading or first large link)
                    let title = null;
                    if (headings.length > 0) {
                        title = headings[0].textContent?.trim();
                    } else if (allLinks.length > 0) {
                        title = allLinks[0].textContent?.trim();
                    }
                    
                    // Find job URL (first link that looks like a job)
                    let url = null;
                    for (const link of allLinks) {
                        if (link.href && (link.href.includes('/jobs/') || link.href.includes('job'))) {
                            url = link.href;
                            break;
                        }
                    }
                    
                    // Parse text for common patterns
                    const lines = allText.split('\\n').map(l => l.trim()).filter(l => l);
                    
                    // Look for salary (£, $ patterns)
                    let salary = null;
                    for (const line of lines) {
                        if (line.match(/£|\\$|per annum|p\\.a\\./i)) {
                            salary = line;
                            break;
                        }
                    }
                    
                    // Look for location (common UK cities/regions)
                    let location = null;
                    for (const line of lines) {
                        if (line.match(/London|Manchester|Birmingham|Leeds|Remote|Home/i)) {
                            location = line;
                            break;
                        }
                    }
                    
                    // Get company (usually in a smaller text or second link)
                    let company = null;
                    if (allLinks.length > 1) {
                        company = allLinks[1].textContent?.trim();
                    }
                    
                    if (title && url) {
                        results.push({
                            title,
                            company,
                            location,
                            salary,
                            postedDate: null,
                            description: lines[Math.min(2, lines.length - 1)] || null,
                            url: url.startsWith('http') ? url : new URL(url, 'https://www.reed.co.uk').href,
                            scrapedAt: new Date().toISOString()
                        });
                    }
                } catch (e) {
                    console.warn('Error extracting job card:', e.message);
                }
            });
            
            return results;
        });
        
        // Add jobs to results
        for (const job of pageJobs) {
            if (jobs.length >= maxResults) break;
            jobs.push(job);
            await Actor.pushData(job);
        }
        
        console.log(`Extracted ${pageJobs.length} jobs from page ${currentPage}`);
        
        if (jobs.length >= maxResults) break;
        
        // Try to go to next page
        const hasNextPage = await page.evaluate(() => {
            const nextButton = document.querySelector('a[rel="next"], a[aria-label*="Next"], .pagination__next, button:has-text("Next")');
            if (nextButton) {
                nextButton.click();
                return true;
            }
            return false;
        });
        
        if (!hasNextPage) {
            console.log('No more pages available');
            break;
        }
        
        // Wait for new page to load
        await page.waitForTimeout(3000);
        currentPage++;
    }
    
    return jobs;
}

Actor.main(async () => {
    const input = await Actor.getInput();
    const {
        searchKeyword = 'software engineer',
        location = 'London',
        maxResults = 50,
        proxyConfiguration,
    } = input || {};

    console.log('Starting Reed.co.uk job scraper', { searchKeyword, location, maxResults });

    // Initialize proxy
    let proxyUrl = null;
    if (proxyConfiguration) {
        const proxyPassword = process.env.APIFY_PROXY_PASSWORD;
        const groups = proxyConfiguration.apifyProxyGroups || ['RESIDENTIAL'];
        const country = proxyConfiguration.apifyProxyCountry || 'GB';
        proxyUrl = `http://groups-${groups.join('+')},country-${country}:${proxyPassword}@proxy.apify.com:8000`;
        console.log('Using Apify proxy', { groups, country });
    }

    // Launch browser
    const browser = await chromium.launch({
        headless: true,
        proxy: proxyUrl ? { server: proxyUrl } : undefined,
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    try {
        // Build search URL
        let searchUrl = `${BASE_URL}/jobs`;
        const params = new URLSearchParams();
        if (searchKeyword) params.append('keywords', searchKeyword);
        if (location) params.append('location', location);
        if (params.toString()) searchUrl += `?${params.toString()}`;

        console.log(`Navigating to: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 60000 });
        
        // Wait for content
        await page.waitForTimeout(3000);

        // Scrape jobs
        const jobs = await scrapeJobListings(page, maxResults);

        console.log(`✅ Scraping complete. Total jobs scraped: ${jobs.length}`);

    } catch (error) {
        console.error('Error during scraping:', error);
        throw error;
    } finally {
        await browser.close();
    }
});
