export interface ActionButtonProps {
	isActive: boolean | (() => boolean)
	switchMode: () => void
}
