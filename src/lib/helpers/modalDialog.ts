/**
 * Create a modal dialog for displaying titile, close button and content.
 */
export class ModalDialog {
	private className: string;
	private dialog: HTMLDialogElement | undefined;
	private title: string;

	/**
	 * Constructor
	 * @param className top level CSS class name for the dialog
	 * @param title titile of the dialog
	 */
	constructor(className: string, title: string) {
		this.className = className;
		this.title = title;
	}

	/**
	 * Create a modal dialog content and return content element.
	 * @param parentElement parent element to append the dialog
	 * @param addConttent callback function to add content to the dialog. The callback receives a content element as an argument and must return the modified content element.
	 * @example
	 * ```ts
	 * const dialog = new ModalDialog('my-dialog', 'My Dialog');
	 * dialog.create(document.body, (content) => {
	 *   const p = document.createElement('p');
	 *   p.textContent = 'This is my dialog content.';
	 *   content.appendChild(p);
	 *   return content;
	 * });
	 * dialog.open();
	 * ```
	 * @returns HTMLDialogElement
	 */
	public create(
		parentElement: HTMLElement,
		addConttent: (contentElement: HTMLDivElement) => HTMLDivElement
	) {
		this.dialog = document.createElement('dialog');
		this.dialog.classList.add(this.className);

		const header = document.createElement('div');
		header.classList.add('dialog-header');

		const title = document.createElement('h3');
		title.textContent = this.title;
		title.classList.add('dialog-title');
		header.appendChild(title);

		const btnClose = document.createElement('button');
		btnClose.type = 'button';
		btnClose.classList.add('close-button');
		btnClose.innerHTML = '×';
		btnClose.setAttribute('aria-label', 'Close dialog');
		btnClose.addEventListener('click', () => {
			this.close();
		});
		header.appendChild(btnClose);

		this.dialog.appendChild(header);

		const content = document.createElement('div');
		content.classList.add(`content`);

		this.dialog.appendChild(addConttent(content));

		this.dialog.addEventListener('click', (event) => {
			const target = event.target as Element | null;
			if (!target) return;
			const rect = target.getBoundingClientRect();

			if (
				rect.left > event.clientX ||
				rect.right < event.clientX ||
				rect.top > event.clientY ||
				rect.bottom < event.clientY
			) {
				this.close();
			}
		});

		parentElement.appendChild(this.dialog);
	}

	/**
	 * Open the modal dialog.
	 */
	public open() {
		this.dialog?.showModal();
	}

	/**
	 * Close the modal dialog.
	 */
	public close() {
		this.dialog?.close();
	}

	/**
	 * Create segment buttons element for the dialog.
	 * @param options options for creating segment buttons
	 * @param defaultValue default value for the segment buttons
	 * @param onClick a callback function to handle click events on the segment buttons
	 * @example
	 * ```ts
	 * const segmentButtons = createSegmentButtons(
	 *   [{ value: 'option1', label: 'Option 1' }, { value: 'option2', label: 'Option 2' }],
	 *   'option1',
	 *   (value) => console.log(`Selected: ${value}`)
	 * );
	 * document.body.appendChild(segmentButtons);
	 * ```
	 * @returns
	 */
	public createSegmentButtons(
		options: { value: string; label: string }[],
		defaultValue: string,
		onClick: (value: string) => void = () => {}
	): HTMLDivElement {
		const segmentButtons = document.createElement('div');
		segmentButtons.classList.add('segment-buttons');

		options.forEach((option) => {
			const button = document.createElement('button');
			button.type = 'button';
			button.classList.add('segment-button');
			button.value = option.value;
			button.textContent = option.label;

			if (option.value === defaultValue) {
				button.classList.add('active');
			}

			button.addEventListener('click', () => {
				segmentButtons
					.querySelectorAll('.segment-button')
					.forEach((btn) => btn.classList.remove('active'));
				button.classList.add('active');
				onClick(button.value);
			});

			segmentButtons.appendChild(button);
		});

		return segmentButtons;
	}
}
