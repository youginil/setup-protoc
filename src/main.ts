import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import os from 'os';
import { execSync } from 'child_process';
import path from 'path';

export function genDlUrl(
    version: string,
    platform: NodeJS.Platform,
    arch: string,
): string {
    let filename = '';
    if (platform == 'win32') {
        const a = arch == 'x64' ? '64' : '32';
        filename = `protoc-${version}-win${a}.zip`;
    } else {
        let ar: string;
        switch (arch) {
            case 'x64': {
                ar = 'x86_64';
            }
            case 'arm64': {
                ar = 'aarch_64';
            }
            case 's390x': {
                ar = 's390_64';
            }
            case 'ppc64': {
                ar = 'ppcle_64';
            }
            default: {
                ar = 'x86_32';
            }
        }
        if (platform == 'darwin') {
            filename = `protoc-${version}-osx-${ar}.zip`;
        } else {
            filename = `protoc-${version}-linux-${ar}.zip`;
        }
    }
    return `https://github.com/protocolbuffers/protobuf/releases/download/v${version}/${filename}`;
}

(async () => {
    try {
        const version = core.getInput('version');
        const platform = os.platform();
        const arch = os.arch();
        console.log(`Platform: ${platform}, Arch: ${arch}`);
        const url = genDlUrl(version, platform, arch);
        console.log(`Downloading from ${url}`);
        core.setOutput('url', url);
        let targetDir = tc.find('protoc', version);
        if (targetDir) {
            console.log('Protoc is cached');
        } else {
            const dlpath = await tc.downloadTool(url);
            const extractDir = await tc.extractZip(dlpath);
            targetDir = await tc.cacheDir(extractDir, 'protoc', version);
        }
        core.setOutput('path', targetDir);
        core.addPath(path.join(targetDir, 'bin'));
        execSync('protoc --version');
    } catch (error: any) {
        core.setFailed(error.message);
    }
})();
