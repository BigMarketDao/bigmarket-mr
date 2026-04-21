import { getStxAddress } from '@bigmarket/bm-common';

export function getAddressId() {
	return getStxAddress().substring(5);
}
export function downloadCsv(data: BlobPart, filename: string) {
	// Creating a Blob for having a csv file format
	// and passing the data with type
	const blob = new Blob([data], { type: 'text/csv' });
	// Creating an object for downloading url
	const url = typeof window !== 'undefined' ? window.URL.createObjectURL(blob) : '';
	// Creating an anchor(a) tag of HTML
	const a = document.createElement('a');
	// Passing the blob downloading url
	a.setAttribute('href', url);
	// Setting the anchor tag attribute for downloading
	// and passing the download file name
	a.setAttribute('download', filename);
	// Performing a download with click
	a.click();
	return data;
}

export function csvMaker(inputData: Array<Record<string, unknown>>, fileName: string) {
	// Empty array for storing the values
	const csvRows = [];
	// Headers is basically a keys of an object
	// which is id, name, and profession
	const headers = Object.keys(inputData[0]);
	// As for making csv format, headers must
	// be separated by comma and pushing it
	// into array
	csvRows.push(headers.join(','));
	// Pushing Object values into array
	// with comma separation
	for (const vote of inputData) {
		csvRows.push(Object.values(vote).join(','));
	}
	// Returning the array joining with new line
	const data = csvRows.join('\n');
	downloadCsv(data, fileName);
}
