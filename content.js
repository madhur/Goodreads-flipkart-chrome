class API {
	// Sends a message to the background script to trigger a fetch request.
	static request = (path, options) => {
		return new Promise((resolve, reject) => {
			const message = { path, options };
			const callback = (result) => {
				if (result && result.error) {
					reject(result.error);
				}

				resolve(result);
			};
			chrome.runtime.sendMessage(message, callback);
		});
	};

	// Converts a simple object to query params.
	static objectToQueryParams = (object) => {
		return Object.keys(object).reduce((soFar, key) => {
			const component = `${key}=${encodeURIComponent(object[key])}`;
			return soFar.length === 0
				? `?${component}`
				: `${soFar}&${component}`;
		}, "");
	};
}

class DOM {
	// Append HTML after an element with a given id.
	static appendAfterElement = (element, htmlToAppend) => {
		if (element) {
			element.outerHTML = `${element.outerHTML}${htmlToAppend}`;
		}
	};
}

class Flipkart {
	// Search the page for ISBNs.
	static findISBN = () => {
		const bodyHTML = document.body.outerText;

		// Try to find an ISBN-10.
		const matches = bodyHTML.match("ISBN: ([0-9A-z]*)");
		if (matches) {
			return matches[1];
		}

		// Fallback to looking for an ISBN-13.
		const fallbackMatches = bodyHTML.match("<li>ISBN: ([0-9A-z\-]*)</li>");
		if (fallbackMatches) {
			return fallbackMatches[1];
		}
	};

	// Searches the page for good anchor element.
	// There's a few options, prioritized by what looks best.
	static findAnchorElement = () => {
		// The thing that shows similar products.
		const similaritiesBucket = document.getElementsByClassName("MocXoX");
		if (similaritiesBucket.length) {
			return similaritiesBucket[0];
		}

		// Whelp, this blows.
		return document.body;
	};
}

class Goodreads {
	static URL = "https://www.goodreads.com";
	static KEY = "";

	// Make API calls to Goodreads.
	// We use this to get the average Goodreads review.
	static getReviewData = (isbn) => {
		const endpoint = "/book/review_counts.json";
		const queryParams = API.objectToQueryParams({
			key: Goodreads.KEY,
			isbns: isbn,
			format: "json",
		});
		const requestURL = `${Goodreads.URL}${endpoint}${queryParams}`;

		const options = {
			method: "GET",
			headers: {
				'Content-Type': 'application/json',
			},
		};

		return API.request(requestURL, options)
			.then(({ books }) => books[0]);
	};

	// Make API calls to Goodreads.
	// We use this to create a Goodreads link.
	static getBookId = (isbn) => {
		const endpoint = "/book/isbn_to_id";
		const queryParams = API.objectToQueryParams({
			key: Goodreads.KEY,
			isbn: isbn,
		});
		const requestURL = `${Goodreads.URL}${endpoint}${queryParams}`;

		const options = {
			method: "GET",
			headers: {
				'Content-Type': 'application/json',
			},
		};

		return API.request(requestURL, options);
	};

	// Creates a link to a book giveen the ISBN.
	static createBookLink = (isbn) => {
		const endpoint = `/book/isbn/${isbn}`;
		const requestURL = `${Goodreads.URL}${endpoint}`;

		return `
			<a class="bookLink" target="_blank" ref="no-referrer" href="${requestURL}"></a>
		`.trim();
	};

	// Appends a Goodreads Reviews widget to the page.
	static createReviewsWidget = async ({
		title = "Reviews from Goodreads",
		reviewBackgroundColor = "ffffff",
		ratingsStarColor = "000000",
		textColor = "000000",
		linkColor = "666600",
		height = 600,
		isbn,
	}) => {
		const endpoint = "/api/reviews_widget_iframe";
		const queryParams = API.objectToQueryParams({
			did: 6984,
			format: "html",
			header_text: title,
			isbn: isbn,
			links: linkColor,
			review_back: reviewBackgroundColor,
			stars: ratingsStarColor,
			text: textColor,
		});
		const iframeURL = `${Goodreads.URL}${endpoint}${queryParams}`;
		const { average_rating } = await Goodreads.getReviewData(isbn);

		const wrapperId = "goodreads-widget";
		const titleId = "goodreads-widget-title";
		const iframeId = "goodreads-widget-iframe";

		return `
			<div id="${wrapperId}">
				<h1 id="${titleId}">
					${title} (${average_rating} / 5) ${Goodreads.createBookLink(isbn)}
				</h1>
				<iframe
					id="${iframeId}"
					src="${iframeURL}"
					height="${height}"
					frameborder="0"></iframe>
			</div>
		`;
	};
}

window.addEventListener("load", startLoading, false);

function startLoading() {

	//var jsInitChecktimer = setInterval(checkForJS_Finish, 111);

	// function checkForJS_Finish() {
	// 	if (document.querySelector("SOME_INDICATOR_NODE_css_SELECTOR")
	// 	) {
	// Search the page for ISBNs.
	const ISBN = Flipkart.findISBN();

	// Search the page for element the widget should anchor itself to.
	const anchorElement = Flipkart.findAnchorElement();

	// Make sure we have an isbn and an anchor.
	if (ISBN && anchorElement) {
		// Create and append the widget.
		Goodreads.createReviewsWidget({ isbn: ISBN }).then((widget) => {
			DOM.appendAfterElement(anchorElement, widget);
		});
	}

	//clearInterval(jsInitChecktimer);
	// DO YOUR STUFF HERE.
	//}
}








