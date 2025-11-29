from playwright.sync_api import sync_playwright

def verify_app(page):
    page.goto("http://localhost:5173")
    # Wait for the app to load
    page.wait_for_selector('h1', state='visible')

    # Check for the header text "SeatPlaner Dittmann"
    page.get_by_role('heading', name='SeatPlaner Dittmann').wait_for()

    # Take a screenshot
    page.screenshot(path="/home/jules/verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_app(page)
        finally:
            browser.close()
