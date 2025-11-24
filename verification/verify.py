from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:5173")
            page.goto("http://localhost:5173")

            # Wait for content to load
            print("Waiting for title...")
            page.wait_for_selector("text=SeatPlaner Dittmann")

            # Take a screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/app_screenshot.png")
            print("Screenshot saved to verification/app_screenshot.png")

        except Exception as e:
            print(f"Error: {e}")
            # Try to take error screenshot
            try:
                page.screenshot(path="verification/error_screenshot.png")
            except:
                pass
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
