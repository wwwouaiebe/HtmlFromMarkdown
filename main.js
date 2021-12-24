/*
Copyright - 2021 - wwwouaiebe - Contact: https://www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
/*
Changes:
	- v1.0.0:
		- created
Doc reviewed 20211224
*/
/* ------------------------------------------------------------------------------------------------------------------------- */

import fs from 'fs';
import process from 'process';
import { marked } from 'marked';

/**
Build an html file from a markdown file
*/

class htmlFromMarkdown {
	
	/**
	The directory whith the sources files
	@type {String}
	*/

	#srcDir;
	
	/**
	The source files names, included the path since this.#srcDir
	@type {Array.<String>}
	*/

	#sourceFileNames;

	/**
	A const to use when exit the app due to a bad parameter
	@type {Number}
	*/

	// eslint-disable-next-line no-magic-numbers
	static get #EXIT_BAD_PARAMETER ( ) { return 9; }
	
	/**
	Read **recursively** the contains of a directory and store all the md files found in the #sourceFileNames property
	@param {String} dir The directory to read. It's a relative path, starting at this.#srcDir ( the path
	given in the --src parameter )
	*/

	#readDir ( dir ) {

		// Searching all files and directories present in the directory
		const fileNames = fs.readdirSync ( this.#srcDir + dir );

		// Loop on the results
		fileNames.forEach (
			fileName => {

				// Searching the stat of the file/directory
				const lstat = fs.lstatSync ( this.#srcDir + dir + fileName );

				if ( lstat.isDirectory ( ) ) {

					// It's a directory. Reading this recursively
					this.#readDir ( dir + fileName + '/' );
				}
				else if ( lstat.isFile ( ) ) {

					// it's a file. Adding to the files list with the relative path, if the extension is 'js'
					if ( 'md' === fileName.split ( '.' ).reverse ( )[ 0 ] ) {
						this.#sourceFileNames.push ( dir + fileName );
					}
				}
			}
		);
	}

	/**
	Validate a path:
	- Verify that the path exists on the computer
	- verify that the path is a directory
	- complete the path with a \
	@param {String} path The path to validate
	*/

	#validatePath ( path ) {
		let returnPath = path;
		if ( '' === returnPath ) {
			console.error ( 'Invalid or missing \x1b[31m--src \x1b[0m parameter' );
			process.exit ( AppLoader.#EXIT_BAD_PARAMETER );
		}
		let pathSeparator = null;
		try {
			returnPath = fs.realpathSync ( path );

			// path.sep seems not working...
			pathSeparator = -1 === returnPath.indexOf ( '\\' ) ? '/' : '\\';
			const lstat = fs.lstatSync ( returnPath );
			if ( lstat.isFile ( ) ) {
				returnPath = returnPath.substring ( 0, returnPath.lastIndexOf ( pathSeparator ) );
			}
		}
		catch {
			console.error ( 'Invalid path for the --src parameter \x1b[31m%s\x1b[0m', returnPath );
			process.exit ( AppLoader.#EXIT_BAD_PARAMETER );
		}
		returnPath += pathSeparator;
		return returnPath;
	}
	
	/**
	Generate an html file from a markdown file
	@param {String} sourceFile the source file name, including the relative path from this.#srcDir
	*/
	
	#generateHtml ( sourceFile ) {

		let rootPath = '';
		let rootPathCounter = sourceFile.split ( '/' ).length - 1;
		while ( 0 < rootPathCounter ) {
			rootPath += '../';
			rootPathCounter --;
		}

		let html =
			'<!DOCTYPE html><html><head><meta charset="UTF-8">' +
			'<link type="text/css" rel="stylesheet" href="'+ rootPath + 'index.css"></head><body>';
		
		html += marked.parse ( fs.readFileSync ( this.#srcDir + sourceFile, 'utf8' ) );
		html += '</body></html>';
		const dest = this.#srcDir + sourceFile.substring ( 0, sourceFile.length - 2 ) + 'html';

		fs.writeFileSync ( dest, html );
		
		console.error ( '\t\x1b[92m' + dest + ' generated\x1b[0m' );

	}
	
	/**
	The constructor
	*/

	constructor ( ) {
		this.#srcDir = '';
		this.#sourceFileNames = [];
	}
	
	/**
	Start process
	*/
	
	loadApp ( ) {
		
		// Reading arguments
		process.argv.forEach (
			arg => {
				const argContent = arg.split ( '=' );
				switch ( argContent [ 0 ] ) {
				case '--src' :
					this.#srcDir = this.#validatePath ( argContent [ 1 ] || this.#srcDir );
					break;
				default:
					break;
				}
			}
		);
		
		// source files list
		this.#readDir ( '' );
		
		this.#sourceFileNames.forEach ( sourceFile => this.#generateHtml ( sourceFile ) );
	}
}

/*
Main ...
*/

new htmlFromMarkdown ( ).loadApp ( );


/* --- End of file --------------------------------------------------------------------------------------------------------- */