const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const htmlToText = require( "html-to-text" );
const TurndownService = require("turndown");

const turndownService = new TurndownService();

const toList = ( arr ) => {
	let str = "";
	if ( arr && arr.length > 0 ) {
		_.each( arr, ( item ) => {
			if ( item && _.trim( item ).length > 0 ) {
				str += `\n  - ${ item }`;
			}
		} )
	}
	return str;
};

const toCommentList = ( comments ) => {
	let str = "";
	if ( comments && comments.length > 0 ) {
		_.each( comments, ( comment ) => {
			if ( comment ) {
				str += `\n  - ${ toCommentObject( comment ) }`;
			}
		} )
	}
	return str;
};

const cleanContent = ( body ) => {
	if ( !body || _.trim( body ).length === 0 ) {
		return "";
	}
	body = body.replace( /#/g, "" );
	body = body.replace( /:/g, "" );
	body = body.replace( /\r?\n|\r/g, " " );
	return body;
};

const toCommentObject = ( comment ) => {
	let str = "";
	if ( comment ) {
		str += `id: ${ comment.id }
    html: |
      ${ cleanContent( htmlToText.fromString(
		  comment.html,
		  {
		    ignoreImage: true,
		    ignoreHref: true,
			wordwrap: false,
			uppercaseHeadings: false,
			singleNewLineParagraphs: true
		  }
      ) ) }
    author:
      name: |
        "${ cleanContent( comment.author.name ) || '' }""
      url: "${ comment.author.url || '' }"
    date: "${ comment.date }"
    isTrackback: ${ comment.isTrackback }`
	}
	return str;
};

module.exports = ( node, options ) => {
	const nodeDate = new Date( node.frontmatter.date );
	const fileTitle = nodeDate.getFullYear() + "-" + ( "0" + ( nodeDate.getMonth() + 1 ) ).slice( -2 ) + "-" + ( "0" + nodeDate.getDate() ).slice( -2 ) + "-" + _.kebabCase( node.slug ) + ".md";
	const filePath = path.join( options.path, `/${ fileTitle }` );
	const fileAlreadyExists = fs.existsSync( filePath );
	if ( options.overwriteExisting || !fileAlreadyExists ) {
		let nodePath = node.slug;
		if ( node.frontmatter.category.toLowerCase() !== "uncategorized" ) {
			nodePath = _.kebabCase( node.frontmatter.category ) + "/" + nodePath;
		}
		let markdown = `---
path: "/${ nodePath }/"
date: "${ node.frontmatter.date }"
title: |
  ${ cleanContent( node.frontmatter.title ) }
slug: "${ node.slug }"
id: "${ node.id }"
author: "${ node.frontmatter.author.name }"
tags: ${ toList( node.frontmatter.tags ) }
layout: "${ node.frontmatter.layout }"
category: "${ node.frontmatter.category }"
images: ${ toList( node.frontmatter.images ) }
cover: "${ node.frontmatter.cover }"
draft: false
comments: ${ toCommentList( node.comments ) }
---

${ turndownService.turndown( node.html ) }
`;
		fs.writeFileSync( filePath, markdown, "utf8" );
	}
};
