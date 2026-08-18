import { Actor } from 'apify';
import { chromium } from 'playwright';

const BASE_URL = 'https://www.reed.co.uk';

async function scrapeJobListings(page, maxResults) {
    const jobs = [];
    let currentPage = 1;
    
    while (jobs.length < maxResults) {
        console.log(`Scraping page ${currentPage}, collected ${jobs.length}/${maxResults} jobs`);
        
        // Wait for job cards to load
        await page.waitForSelector('article[data-qa="job-card"]', { timeout: 30000 });
        
        // Extract job data from current page
        const pageJobs = await page.evaluate(() => {
            const jobCards = document.querySelectorAll('article[data-qa="job-card"]');
            const results = [];
            
            jobCards.forEach(card => {
                try {
                    const titleEl = card.querySelector('h2[data-qa="job-card-title"] a');
                    const companyEl = card.querySelector('a[data-qa="job-card-employer"]');
                    const locationEl = card.querySelector('li[data-qa="job-card-location"]');
                    const salaryEl = card.querySelector('li[data-qa="job-card-salary"]');
                    const dateEl = card.querySelector('li[data-qa="job-card-posted-date"]');
                    const descEl = card.querySelector('p[data-qa="job-card-description"]');
                    
                    results.push({
                        title: titleEl?.textContent?.trim() || null,
                        company: companyEl?.textContent?.trim() || null,
                        location: locationEl?.textContent?.trim() || null,
                        salary: salaryEl?.textContent?.trim() || null,
                        postedDate: dateEl?.textContent?.trim() || null,
                        description: descEl?.textContent?.trim() || null,
                        url: titleEl?.href ? new URL(titleEl.href, 'https://www.reed.co.uk').href : null,
                        scrapedAt: new Date().toISOString()
                    });
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
            const nextButton = document.querySelector('a[data-qa="pagination-next"]');
            if (nextButton && !nextButton.classList.contains('disabled')) {
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
        await page.waitForTimeout(2000);
        currentPage++;
    }
    
    return jobs;
}

Actor.main(async () => {
    const input = await Actor.getInput();
    const {
        searchKeyword = '',
        location = '',
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
