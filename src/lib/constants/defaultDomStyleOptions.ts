export const defaultTextAreaStyleOptions = {
	padding: '4px 8px',
	fontSize: '12px',
	fontFamily: 'sans-serif',
	borderBottom: 'none',
	borderRadius: '6px 6px 0 0',
	background: 'rgba(255,255,255,0.95)',
	color: '#111',
	resize: 'none',
	outline: 'none',
	width: '100%',
	boxSizing: 'border-box',
	position: 'relative'
} as CSSStyleDeclaration;

export const defaultSubmitButtonStyleOptions = {
	padding: '4px 8px',
	fontSize: '11px',
	fontFamily: 'sans-serif',
	backgroundColor: '#3F97E0',
	color: '#ffffff',
	border: '1.5px solid #4CC9F0',
	borderTop: 'none',
	borderRadius: '6px',
	cursor: 'pointer',
	width: '40%',
	textAlign: 'center',
	boxSizing: 'border-box',
	display: 'flex',
	gap: '0px 4px',
	position: 'absolute',
	bottom: '2px',
	right: '4px',
	alignContent: 'center'
} as CSSStyleDeclaration;

export const defaultTextAreaWrapperStyleOptions = {
	position: 'absolute',
	zIndex: '1000',
	display: 'flex',
	flexDirection: 'column',
	minWidth: '140px',
	maxWidth: '240px',
	boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
	borderRadius: '6px',
	overflow: 'hidden'
};
