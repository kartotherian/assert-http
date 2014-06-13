var fs = require('fs');
var http = require('http');
var path = require('path');
var assertHTTP = require('../');
var assert = assertHTTP.assert;

describe('assert.response', function() {

    before(function() {
        this.server = http.createServer(function (req, res) {
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end('Hello World\n');
        }).listen(4000, '127.0.0.1');
    });

    after(function(done) {
        this.server.close(done);
    });

    it('should have assert.response available', function(done) {
        assert.ok(assert.response);
        done();
    });

    it('should fail on bad body', function(done) {
        assert.response({
            method: 'GET',
            path: '/',
            port: 4000,
        }, {
            body: 'Goodbye World\n',
            headers: {
                'content-type': 'text/plain'
            },
            statusCode: 200
        }, function(err) {
            assert.ok(err, 'Failed to detect bad body');
            assert.strictEqual(err.message.indexOf('Invalid response body'), 0, 'Unexpected error message');
            done();
        });
    });
    it('should fail on bad header', function(done) {
        assert.response({
            method: 'GET',
            path: '/',
            port: 4000,
        }, {
            body: 'Hello World\n',
            headers: {
                'content-type': 'application/json'
            },
            statusCode: 200
        }, function(err) {
            assert.ok(err, 'Failed to detect bad header');
            assert.strictEqual(err.message.indexOf('Invalid response header'), 0, 'Unexpected error message');
            done();
        });
    });

    it('should fail on status code', function(done) {
        assert.response({
            method: 'GET',
            path: '/',
            port: 4000,
        }, {
            body: 'Hello World\n',
            headers: {
                'content-type': 'text/plain'
            },
            statusCode: 404
        }, function(err) {
            assert.ok(err, 'Failed to detect bad status code');
            assert.strictEqual(err.message.indexOf('Invalid response status code'), 0, 'Unexpected error message');
            done();
        });
    });

    it('should succeed', function(done) {
        assert.response({
            method: 'GET',
            path: '/',
            port: 4000,
        }, {
            body: 'Hello World\n',
            headers: {
                'content-type': 'text/plain'
            },
            statusCode: 200 
        }, function(err, resp) {
            assert.ifError(err);
            done();
        });
    });
});

describe('assertHTTP.load', function() {
    var tests = assertHTTP.load(path.join(__dirname, 'fixtures'));
    assert.ok(tests.length, 'Failed to load any tests');
    tests.forEach(function(test) {
        assert.ok(test.id);
        assert.ok(test.name);
        assert.ok(test.filepath);
        assert.ok(test.fixture.request);
        assert.ok(test.fixture.response);
    });
});

describe('assertHTTP.runtest', function() {
    before(function() {
        this.server = http.createServer(function (req, res) {
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end('Hello World\n');
        }).listen(4000, '127.0.0.1');
    });

    after(function(done) {
        this.server.close(done);
    });

    function strip(k,v) { return undefined; }
    var clean = {
        connection: strip,
        date: strip,
        'transfer-encoding': strip
    };

    assertHTTP.load(path.join(__dirname, 'fixtures')).forEach(function(test) {
        it(test.name, function(done) {
            assertHTTP.runtest(test, {clean: clean}, function(err) {
                if (test.id == 'clean-fail') {
                    assert.ok(err);
                    assert.notEqual(err.actual, err.expected);
                } else {
                    assert.ifError(err);
                }
                done();
            });
        });
    });
});

describe('assertHTTP.imageEqualsFile', function() {
    var a = fs.readFileSync(__dirname + '/fixtures/a.png');
    it('pass when identical', function(done) {
        assertHTTP.imageEqualsFile(a, __dirname + '/fixtures/a.png', function(err) {
            assert.ifError(err);
            done();
        });
    });
    it('pass when identical', function(done) {
        assertHTTP.imageEqualsFile(a, __dirname + '/fixtures/b.png', function(err) {
            assert.ok(err);
            assert.ok(/Error: Image is too different from fixture/.test(err.toString()));
            done();
        });
    });
});
