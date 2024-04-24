import { Injectable, StreamableFile } from '@nestjs/common';
import { PDFDocument, rgb } from 'pdf-lib';
import { pdfTextContent } from './dtos/pdf.dto';

@Injectable()
export class PdfService {
  constructor() {}

  async HighLightLine(
    file: Express.Multer.File,
    body: pdfTextContent[],
    highLightText: string,
  ) {
    const pdfDoc = await PDFDocument.load(file.buffer);
    const page = pdfDoc.getPages()[0];
    var isPdfHighlighted = false;
    for (const textContent of body) {
      if (
        textContent.str
          .trim()
          .toLocaleLowerCase()
          .includes(highLightText.trim().toLocaleLowerCase())
      ) {
        isPdfHighlighted = true;
        page.drawRectangle({
          x: textContent.transform[4],
          y: textContent.transform[5],
          width: textContent.width,
          height: textContent.height,
          opacity: 0.1,
          color: rgb(1, 1, 0), // Yellow color
        });
      }
    }
    if (!isPdfHighlighted) {
      const filteredText: pdfTextContent[][] = [];
      const filteredString: string[] = [];
      var index: number = 0;
      for (const textContent of body) {
        if (textContent.str !== '') {
          if (!filteredString[index]) {
            filteredString[index] = '';
          }
          filteredString[index] += textContent.str;
          if (!filteredText[index]) filteredText[index] = [];
          filteredText[index].push(textContent);
        } else {
          index++;
        }
      }
      for (var i = 0; i < filteredString.length; i++) {
        if (
          filteredString[i]
            .trim()
            .toLocaleLowerCase()
            .includes(highLightText.trim().toLocaleLowerCase())
        ) {
          filteredText[i].forEach((textToBeHighlighed) => {
            page.drawRectangle({
              x: textToBeHighlighed.transform[4],
              y: textToBeHighlighed.transform[5],
              width: textToBeHighlighed.width,
              height: textToBeHighlighed.height,
              opacity: 0.1,
              color: rgb(1, 1, 0), // Yellow color
            });
          });
        }
      }
    }

    const modifiedPdfData = await pdfDoc.save();

    return new StreamableFile(Buffer.from(modifiedPdfData));
  }
  async HighLightParagraph(
    file: Express.Multer.File,
    body: pdfTextContent[],
    highLightText: string,
  ) {
    const pdfDoc = await PDFDocument.load(file.buffer);
    const page = pdfDoc.getPages()[0];
    var isPdfHighlighted = false;

    for (const textContent of body) {
      if (
        textContent.str
          .trim()
          .toLocaleLowerCase()
          .includes(highLightText.trim().toLocaleLowerCase())
      ) {
        isPdfHighlighted = true;
        page.drawRectangle({
          x: textContent.transform[4],
          y: textContent.transform[5],
          width: textContent.width,
          height: textContent.height,
          opacity: 0.1,
          color: rgb(1, 1, 0), // Yellow color
        });
      }
    }

    if (!isPdfHighlighted) {
      const requiredIndexes = [[]];
      var currentMultipleIndexes = 0;

      for (let i = 0; i < body.length; i++) {
        if (
          highLightText
            .trim()
            .toLowerCase()
            .includes(body[i].str.trim().toLowerCase())
        ) {
          if (
            requiredIndexes[currentMultipleIndexes].length !== 0 &&
            i -
              requiredIndexes[currentMultipleIndexes][
                requiredIndexes[currentMultipleIndexes].length - 1
              ] >
              1
          ) {
            currentMultipleIndexes += 1;
            requiredIndexes[currentMultipleIndexes] = [];
          }
          requiredIndexes[currentMultipleIndexes].push(i);
        }
      }
      if (requiredIndexes[0].length !== 0) {
        var indexToHighlight = 0;
        var highestLength = 0;
        requiredIndexes.forEach((indexArray, i) => {
          if (indexArray.length > highestLength) {
            highestLength = indexArray.length;
            indexToHighlight = i;
          }
        });

        for (let i = 0; i < requiredIndexes[indexToHighlight].length; i++) {
          page.drawRectangle({
            x: body[requiredIndexes[indexToHighlight][i]].transform[4],
            y: body[requiredIndexes[indexToHighlight][i]].transform[5],
            width: body[requiredIndexes[indexToHighlight][i]].width,
            height: body[requiredIndexes[indexToHighlight][i]].height,
            opacity: 0.1,
            color: rgb(1, 1, 0),
          });
        }
      }
    }

    const modifiedPdfData = await pdfDoc.save();

    return new StreamableFile(Buffer.from(modifiedPdfData));
  }
}
