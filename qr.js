import inquirer from "inquirer";
import qr from "qr-image";
import fs from "fs";
import fsPromises from "fs/promises";
import chalk from "chalk";
import validator from "validator";
import path from "path";

async function getURL() {
    try {
        let answer = await inquirer.prompt([{ message: "Type in your URL:", name: "url" }]);
        return answer.url;
    } catch (err) {
        throw new Error(`Error in inputting URL: ${err}`);
    }
}

async function getImageType() {
    try {
        let answer = await inquirer.prompt([{
            message: "Select image type:",
            name: "imageType",
            type: "list",
            choices: ["png", "svg", "pdf"]
        }]);
        return answer.imageType;
    } catch (err) {
        throw new Error(`Error in inputting image type: ${err}`);
    }
}

async function generateQrCode(url, imageType) {
    let imgType = {};
    try {
        switch (imageType) {
            case "svg":
                imgType = { type: "svg" };
                break;
            case "png":
                imgType = { type: "png" };
                break;
            default:
                imgType = { type: "pdf" };
        }

        let imgName = "";
        let wwwIndex = url.indexOf("www");
        if (wwwIndex === -1) {
            let dbFwIndex = url.indexOf("//");
            dbFwIndex = dbFwIndex === -1 ? 0 : dbFwIndex + 2;
            imgName = url.substring(dbFwIndex, url.indexOf(".", dbFwIndex));
        } else {
            let secondDot = url.indexOf(".", wwwIndex + 4);
            imgName = url.substring(wwwIndex + 4, secondDot);
        }

        const dirPath = "./qrcodes";
        if (!fs.existsSync(dirPath)) {
            await fsPromises.mkdir(dirPath);
        }

        let fileName = imgName + "_img." + imgType.type;
        let filePath = path.join(dirPath, fileName);
        let wrStream = fs.createWriteStream(filePath);
        let qrcodes = qr.image(url, imgType);
        qrcodes.pipe(wrStream);

        return fileName;
    } catch (err) {
        throw new Error(`Error in generating QR code image: ${err}`);
    }
}

async function writeToFile(filepath, url) {
    try {
        await fsPromises.appendFile(filepath, url + "\n");
    } catch (err) {
        throw new Error(`Error in appending URL to file: ${err}`);
    }
}

async function doTask() {
    try {
        let url = await getURL();
        console.log(chalk.blue(`You typed: ${url}`));

        let isValidUrl = validator.isURL(url);
        if (!isValidUrl) {
            throw new Error(`Invalid URL: ${url}`);
        }

        console.log(chalk.green("It is a valid URL"));

        let imageType = await getImageType();
        console.log(chalk.blue(`You selected: ${imageType}`));

        let fileName = await generateQrCode(url, imageType);
        if (!fileName.trim()) {
            throw new Error("Could not generate QR code");
        }

        console.log(chalk.green(`QR Code generated and saved in ${fileName}`));

        const filePath = "./qrcodes/URL.txt";
        await writeToFile(filePath, url);

        console.log(chalk.green("URL saved in URL.txt"));
    } catch (err) {
        console.log(chalk.red(err.message));
    }
}

doTask();
