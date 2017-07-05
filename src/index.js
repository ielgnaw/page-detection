/**
 * @file 入口
 * @author ielgnaw <wuji0223@gmail.com>
 */

import fs from 'fs';
import {launch} from 'chrome-launcher';
import chromeRemote from 'chrome-remote-interface';
import chalk from 'chalk';

/* jshint ignore: start */
async function launchChrome() {
    return await launch({
        port: 9222,
        chromeFlags: ['--window-size=412,732', '--disable-gpu', '--headless']
    })
}
/* jshint ignore: end */

/* jshint ignore: start */
async function test(protocol, launcher) {
    const {Page, CSS, DOM, Network, Runtime} = protocol;

    await Page.enable();
    await DOM.enable();
    await CSS.enable();
    await Network.enable();
    await Runtime.enable();

    await Page.navigate({
        url: 'http://ielgnaw.com'
    });

    Network.requestWillBeSent(async data => {
        const time = `timestamp: ${chalk.green(data.timestamp)}`;
        const flag = `${chalk.blue('willSend')}`;
        const requestId = `requestId: ${data.requestId}`;
        const url = `url: ${data.request.url}`;
        console.log(flag + ' | ' + time + ' | ' + requestId + ' | ' + url);
    });

    Network.loadingFailed(async data => {
        const time = `timestamp: ${chalk.green(data.timestamp)}`;
        const flag = `${chalk.red('loadFail')}`;
        const requestId = `requestId: ${data.requestId}`;
        console.log(flag + ' | ' + time + ' | ' + requestId);
    });

    Network.loadingFinished(async data => {
        const time = `timestamp: ${chalk.green(data.timestamp)}`;
        const flag = `${chalk.magenta('loadDone')}`;
        const requestId = `requestId: ${data.requestId}`;
        console.log(flag + ' | ' + time + ' | ' + requestId);
    });

    Network.responseReceived(async data => {
        const time = `timestamp: ${chalk.cyan(data.timestamp)}`;
        const flag = `${chalk.green('respRecv')}`;
        const requestId = `requestId: ${data.requestId}`;
        const type = `type: ${data.type}`;
        const status = `status: ${data.response.status}`;
        const contentLength = `Content-length: ${data.response.headers['Content-Length']}`;

        console.log(
            flag + ' | ' + time + ' | ' + requestId + ' | ' + type + ' | ' + status + ' | ' + contentLength
        );
    });

    Network.requestServedFromCache(async data => {
        const time = `timestamp: ${chalk.gray(data.timestamp)}`;
        const flag = `${chalk.red('respFromCache')}`;
        const requestId = `requestId: ${data.requestId}`;

        console.log(flag + ' | ' + time + ' | ' + requestId);
    });

    Page.domContentEventFired(async data => {
        console.log(`\n${chalk.bgGreen('DOMContentLoad timestamp: ' + data.timestamp)}\n`);
    });

    Page.loadEventFired(async data => {
        console.log(`\n${chalk.bgCyan('onLoad timestamp: ' + data.timestamp)}\n`);
        console.log('三秒后页面会发送一个 ajax 请求，这里也可以捕获到');

        setTimeout(async () => {
            const code = `
                (() => {
                    var btn = document.querySelector("#send");
                    btn.click();
                    return btn;
                })()
            `;
            const ret = await Runtime.evaluate({expression: code});

            setTimeout(() => {
                console.log(`点击的那个按钮信息: ${JSON.stringify(ret)}`);
                protocol.close();
                launcher.kill();
            }, 1000);
        }, 3000);
    });
}
/* jshint ignore: end */

/* jshint ignore: start */
async function init() {
    const launcher = await launchChrome();

    await chromeRemote(async protocol => {
        try {
            test(protocol, launcher);
        }
        catch (e) {
            console.error(e);
        }

    }).on('error', err => {
        console.error('Cannot connect to browser:', err);
    });
}

init();

/* jshint ignore: end */
