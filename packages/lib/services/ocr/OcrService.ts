import { toIso639 } from '../../locale';
import Resource from '../../models/Resource';
import Setting from '../../models/Setting';
import shim from '../../shim';
import { ResourceEntity, ResourceOcrStatus } from '../database/types';
import OcrDriverBase from './OcrDriverBase';
import { RecognizeResult } from './utils/types';
import { Minute } from '@joplin/utils/time';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('OcrService');

// From: https://github.com/naptha/tesseract.js/blob/master/docs/image-format.md
export const supportedMimeTypes = [
	'application/pdf',
	'image/bmp',
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/webp',
	'image/x-portable-bitmap',
];

export default class OcrService {

	private driver_: OcrDriverBase;
	private isRunningInBackground_ = false;
	private maintenanceTimer_: any = null;
	private pdfExtractDir_: string = null;
	private isProcessingResources_ = false;

	public constructor(driver: OcrDriverBase) {
		this.driver_ = driver;
	}

	private async pdfExtractDir(): Promise<string> {
		if (this.pdfExtractDir_ !== null) return this.pdfExtractDir_;
		const p = `${Setting.value('tempDir')}/ocr_pdf_extract`;
		await shim.fsDriver().mkdir(p);
		this.pdfExtractDir_ = p;
		return this.pdfExtractDir_;
	}

	private async recognize(language: string, resource: ResourceEntity): Promise<RecognizeResult> {
		if (resource.encryption_applied) throw new Error(`Cannot OCR encrypted resource: ${resource.id}`);

		const resourceFilePath = Resource.fullPath(resource);

		if (resource.mime === 'application/pdf') {
			const imageFilePaths = await shim.pdfToImages(resourceFilePath, await this.pdfExtractDir());
			const results: RecognizeResult[] = [];
			for (const imageFilePath of imageFilePaths) {
				results.push(await this.driver_.recognize(language, imageFilePath));
			}

			for (const imageFilePath of imageFilePaths) {
				await shim.fsDriver().remove(imageFilePath);
			}

			return {
				text: results.map(r => r.text).join('\n'),
			};
		} else {
			return this.driver_.recognize(language, resourceFilePath);
		}
	}

	public async dispose() {
		await this.driver_.dispose();
	}

	public async processResources() {
		if (this.isProcessingResources_) return;

		this.isProcessingResources_ = true;

		try {
			const language = toIso639(Setting.value('locale'));

			let totalProcesed = 0;

			while (true) {
				const resources = await Resource.needOcr(supportedMimeTypes, {
					fields: [
						'id',
						'mime',
						'file_extension',
						'encryption_applied',
					],
				});

				logger.info(`Found ${resources.length} resources to process...`);

				if (!resources.length) break;

				for (const resource of resources) {
					logger.info(`Processing resource ${resource.id} (type ${resource.mime})...`);

					const toSave: ResourceEntity = {
						id: resource.id,
					};

					try {
						const result = await this.recognize(language, resource);
						toSave.ocr_status = ResourceOcrStatus.Done;
						toSave.ocr_text = result.text;
						toSave.ocr_error = '';
					} catch (error) {
						logger.warn(`Could not process resource ${resource.id}: ${error.message}`);
						toSave.ocr_error = error.message;
						toSave.ocr_status = ResourceOcrStatus.Error;
					}

					await Resource.save(toSave);
					totalProcesed++;
				}
			}

			logger.info(`${totalProcesed} resources have been processed.`);
		} finally {
			this.isProcessingResources_ = false;
		}
	}

	public async maintenance() {
		logger.info('Processing resources...');
		await this.processResources();
		logger.info('Done processing resources');
	}

	public runInBackground() {
		if (this.isRunningInBackground_) return;

		this.isRunningInBackground_ = true;

		if (this.maintenanceTimer_) return;

		logger.info('Starting background service...');

		this.maintenanceTimer_ = shim.setInterval(async () => {
			await this.maintenance();
			this.maintenanceTimer_ = null;
		}, 5 * Minute);
	}

	public stopRunInBackground() {
		logger.info('Stopping background service...');

		if (this.maintenanceTimer_) shim.clearInterval(this.maintenanceTimer_);
		this.maintenanceTimer_ = null;
		this.isRunningInBackground_ = false;
	}

}
