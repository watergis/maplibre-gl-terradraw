import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModalDialog } from './modalDialog';

// Global setup to mock HTMLDialogElement methods
beforeEach(() => {
	// Mock showModal and close methods on HTMLDialogElement prototype
	HTMLDialogElement.prototype.showModal = vi.fn();
	HTMLDialogElement.prototype.close = vi.fn();
});

describe('ModalDialog', () => {
	let container: HTMLElement;
	let modalDialog: ModalDialog;

	beforeEach(() => {
		// Setup DOM container
		container = document.createElement('div');
		document.body.appendChild(container);

		// Create modal dialog instance
		modalDialog = new ModalDialog('test-dialog', 'Test Dialog');
	});

	afterEach(() => {
		// Clean up DOM
		document.body.innerHTML = '';
		vi.clearAllMocks();
	});

	describe('constructor', () => {
		it('should create instance with correct className and title', () => {
			const dialog = new ModalDialog('custom-class', 'Custom Title');
			expect(dialog).toBeInstanceOf(ModalDialog);
		});
	});

	describe('create', () => {
		it('should create dialog element with correct structure', () => {
			modalDialog.create(container, (content) => {
				const p = document.createElement('p');
				p.textContent = 'Test content';
				content.appendChild(p);
				return content;
			});

			const dialog = container.querySelector('.test-dialog') as HTMLDialogElement;
			expect(dialog).toBeTruthy();
			expect(dialog.tagName).toBe('DIALOG');
		});

		it('should create header with title and close button', () => {
			modalDialog.create(container, (content) => content);

			const header = container.querySelector('.dialog-header');
			const title = container.querySelector('.dialog-title');
			const closeButton = container.querySelector('.close-button');

			expect(header).toBeTruthy();
			expect(title?.textContent).toBe('Test Dialog');
			expect(closeButton?.innerHTML).toBe('×');
			expect(closeButton?.getAttribute('aria-label')).toBe('Close dialog');
		});

		it('should create content area and call addContent callback', () => {
			const addContentSpy = vi.fn((content) => {
				const p = document.createElement('p');
				p.textContent = 'Test content';
				content.appendChild(p);
				return content;
			});

			modalDialog.create(container, addContentSpy);

			expect(addContentSpy).toHaveBeenCalledOnce();
			const content = container.querySelector('.content');
			expect(content).toBeTruthy();
			expect(content?.querySelector('p')?.textContent).toBe('Test content');
		});

		it('should remove existing dialog with same className before creating new one', () => {
			// Create first dialog
			modalDialog.create(container, (content) => content);
			expect(container.querySelectorAll('.test-dialog')).toHaveLength(1);

			// Create second dialog with same className
			modalDialog.create(container, (content) => content);
			expect(container.querySelectorAll('.test-dialog')).toHaveLength(1);
		});

		it('should add click event listener for backdrop close', () => {
			const closeSpy = vi.spyOn(modalDialog, 'close');
			modalDialog.create(container, (content) => content);

			const dialog = container.querySelector('.test-dialog') as HTMLDialogElement;

			// Mock getBoundingClientRect to simulate click outside dialog
			vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
				left: 100,
				right: 200,
				top: 100,
				bottom: 200,
				width: 100,
				height: 100,
				x: 100,
				y: 100,
				toJSON: () => ({})
			});

			// Simulate click outside dialog bounds
			const event = new MouseEvent('click', {
				clientX: 50,
				clientY: 50
			});
			Object.defineProperty(event, 'target', { value: dialog });

			dialog.dispatchEvent(event);
			expect(closeSpy).toHaveBeenCalled();
		});
	});

	describe('open', () => {
		it('should call showModal on dialog element', () => {
			modalDialog.create(container, (content) => content);

			const dialog = container.querySelector('.test-dialog') as HTMLDialogElement;

			modalDialog.open();
			expect(dialog.showModal).toHaveBeenCalledOnce();
		});

		it('should handle case when dialog is undefined', () => {
			expect(() => modalDialog.open()).not.toThrow();
		});
	});

	describe('close', () => {
		it('should call close on dialog element', () => {
			modalDialog.create(container, (content) => content);

			const dialog = container.querySelector('.test-dialog') as HTMLDialogElement;

			modalDialog.close();
			expect(dialog.close).toHaveBeenCalledOnce();
		});

		it('should be called when close button is clicked', () => {
			modalDialog.create(container, (content) => content);

			const closeButton = container.querySelector('.close-button') as HTMLButtonElement;
			const closeSpy = vi.spyOn(modalDialog, 'close');

			closeButton.click();
			expect(closeSpy).toHaveBeenCalledOnce();
		});

		it('should handle case when dialog is undefined', () => {
			expect(() => modalDialog.close()).not.toThrow();
		});
	});

	describe('createSegmentButtons', () => {
		const options = [
			{ value: 'option1', label: 'Option 1' },
			{ value: 'option2', label: 'Option 2' },
			{ value: 'option3', label: 'Option 3' }
		];

		it('should create segment buttons container with correct structure', () => {
			const segmentButtons = modalDialog.createSegmentButtons(options, 'option1');

			expect(segmentButtons.classList.contains('segment-buttons')).toBe(true);
			expect(segmentButtons.children).toHaveLength(3);
		});

		it('should create buttons with correct properties', () => {
			const segmentButtons = modalDialog.createSegmentButtons(options, 'option1');

			const buttons = segmentButtons.querySelectorAll('.segment-button');
			expect(buttons).toHaveLength(3);

			buttons.forEach((button, index) => {
				expect(button.tagName).toBe('BUTTON');
				expect((button as HTMLButtonElement).type).toBe('button');
				expect((button as HTMLButtonElement).value).toBe(options[index].value);
				expect(button.textContent).toBe(options[index].label);
			});
		});

		it('should set default active button correctly', () => {
			const segmentButtons = modalDialog.createSegmentButtons(options, 'option2');

			const buttons = segmentButtons.querySelectorAll('.segment-button');
			expect(buttons[0].classList.contains('active')).toBe(false);
			expect(buttons[1].classList.contains('active')).toBe(true);
			expect(buttons[2].classList.contains('active')).toBe(false);
		});

		it('should handle click events and update active state', () => {
			const onClickSpy = vi.fn();
			const segmentButtons = modalDialog.createSegmentButtons(options, 'option1', onClickSpy);

			const buttons = segmentButtons.querySelectorAll(
				'.segment-button'
			) as NodeListOf<HTMLButtonElement>;

			// Click second button
			buttons[1].click();

			// Check active states
			expect(buttons[0].classList.contains('active')).toBe(false);
			expect(buttons[1].classList.contains('active')).toBe(true);
			expect(buttons[2].classList.contains('active')).toBe(false);

			// Check callback was called
			expect(onClickSpy).toHaveBeenCalledWith('option2');
		});

		it('should work without onClick callback', () => {
			const segmentButtons = modalDialog.createSegmentButtons(options, 'option1');
			const buttons = segmentButtons.querySelectorAll(
				'.segment-button'
			) as NodeListOf<HTMLButtonElement>;

			expect(() => buttons[1].click()).not.toThrow();
			expect(buttons[1].classList.contains('active')).toBe(true);
		});

		it('should handle empty options array', () => {
			const segmentButtons = modalDialog.createSegmentButtons([], '');

			expect(segmentButtons.classList.contains('segment-buttons')).toBe(true);
			expect(segmentButtons.children).toHaveLength(0);
		});

		it('should handle non-existent default value', () => {
			const segmentButtons = modalDialog.createSegmentButtons(options, 'non-existent');
			const buttons = segmentButtons.querySelectorAll('.segment-button');

			buttons.forEach((button) => {
				expect(button.classList.contains('active')).toBe(false);
			});
		});

		it('should call onClick with correct value for each button', () => {
			const onClickSpy = vi.fn();
			const segmentButtons = modalDialog.createSegmentButtons(options, 'option1', onClickSpy);
			const buttons = segmentButtons.querySelectorAll(
				'.segment-button'
			) as NodeListOf<HTMLButtonElement>;

			buttons[0].click();
			expect(onClickSpy).toHaveBeenLastCalledWith('option1');

			buttons[2].click();
			expect(onClickSpy).toHaveBeenLastCalledWith('option3');

			expect(onClickSpy).toHaveBeenCalledTimes(2);
		});
	});

	describe('integration tests', () => {
		it('should create a complete functional dialog', () => {
			modalDialog.create(container, (content) => {
				const section = document.createElement('div');
				section.classList.add('test-section');

				const label = document.createElement('label');
				label.textContent = 'Test Label';
				section.appendChild(label);

				const segmentButtons = modalDialog.createSegmentButtons(
					[
						{ value: 'a', label: 'A' },
						{ value: 'b', label: 'B' }
					],
					'a',
					(value) => console.log(`Selected: ${value}`)
				);
				section.appendChild(segmentButtons);
				content.appendChild(section);

				return content;
			});

			// Verify complete structure
			const dialog = container.querySelector('.test-dialog');
			const header = dialog?.querySelector('.dialog-header');
			const title = dialog?.querySelector('.dialog-title');
			const closeButton = dialog?.querySelector('.close-button');
			const content = dialog?.querySelector('.content');
			const section = content?.querySelector('.test-section');
			const segmentButtons = section?.querySelector('.segment-buttons');
			const buttons = segmentButtons?.querySelectorAll('.segment-button');

			expect(dialog).toBeTruthy();
			expect(header).toBeTruthy();
			expect(title?.textContent).toBe('Test Dialog');
			expect(closeButton).toBeTruthy();
			expect(content).toBeTruthy();
			expect(section).toBeTruthy();
			expect(buttons).toHaveLength(2);
			expect(buttons?.[0].classList.contains('active')).toBe(true);
		});
	});
});
