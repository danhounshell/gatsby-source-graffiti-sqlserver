global.proxyquire = require( "proxyquire" ).noPreserveCache();
const chai = require( "chai" );
chai.use( require( "sinon-chai" ) );
chai.use( require( "chai-as-promised" ) );
chai.use( require( "dirty-chai" ) );
global.should = chai.should();
global._ = require( "lodash" );
global.sinon = require( "sinon" );