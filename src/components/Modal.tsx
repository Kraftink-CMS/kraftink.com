import type BootstrapModal from 'bootstrap/js/dist/modal';
import { useEffect, useEffectEvent, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

export function Modal({
    open,
    onClose,
    labelledBy,
    children,
    dismissible = true,
    trapFocus = false,
    initialFocus,
    size,
}: {
    open: boolean;
    onClose: () => void;
    labelledBy: string;
    children: ReactNode;
    dismissible?: boolean;
    trapFocus?: boolean;
    initialFocus?: RefObject<HTMLElement | null>;
    size?: 'lg';
}) {
    const element = useRef<HTMLDivElement>(null);
    const [ModalConstructor, setModalConstructor] = useState<typeof BootstrapModal | null>(null);
    const instance = useRef<BootstrapModal | null>(null);
    const previousFocus = useRef<HTMLElement | null>(null);
    const disposing = useRef(false);
    const beforeHide = useEffectEvent((event: Event) => {
        if (disposing.current || !open) {
            return;
        }
        if (!dismissible) {
            event.preventDefault();
            return;
        }
        onClose();
    });
    const shown = useEffectEvent(() => (initialFocus?.current ?? element.current)?.focus());

    useEffect(() => {
        if (!open || ModalConstructor) {
            return;
        }
        let active = true;
        void import('bootstrap/js/dist/modal').then(({ default: Constructor }) => {
            if (active) {
                setModalConstructor(() => Constructor);
            }
        });
        return () => {
            active = false;
        };
    }, [open, ModalConstructor]);

    useEffect(() => {
        if (!ModalConstructor) {
            return;
        }
        const node = element.current!;
        disposing.current = false;
        const modal = new ModalConstructor(node, { focus: trapFocus });
        instance.current = modal;
        const hiding = (event: Event) => beforeHide(event);
        const showing = () => shown();
        const hidden = () => {
            if (!document.querySelector('.modal.show') && previousFocus.current?.isConnected) {
                previousFocus.current.focus();
            }
        };
        const cycleFocus = (event: KeyboardEvent) => {
            if (!trapFocus || event.key !== 'Tab') {
                return;
            }
            const controls = Array.from(
                node.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]'),
            ).filter(
                (control) => control.tabIndex >= 0 && !control.matches(':disabled') && control.getClientRects().length,
            );
            const first = controls[0];
            const last = controls.at(-1);
            const focused = document.activeElement;
            if (!first || (event.shiftKey ? focused === first || focused === node : focused === last)) {
                event.preventDefault();
                (event.shiftKey ? (last ?? node) : (first ?? node)).focus();
            }
        };
        node.addEventListener('hide.bs.modal', hiding);
        node.addEventListener('shown.bs.modal', showing);
        node.addEventListener('hidden.bs.modal', hidden);
        node.addEventListener('keydown', cycleFocus);
        return () => {
            disposing.current = true;
            modal.hide();
            modal.dispose();
            node.removeEventListener('hide.bs.modal', hiding);
            node.removeEventListener('shown.bs.modal', showing);
            node.removeEventListener('hidden.bs.modal', hidden);
            node.removeEventListener('keydown', cycleFocus);
            instance.current = null;
        };
    }, [ModalConstructor, trapFocus]);

    useEffect(() => {
        if (open && ModalConstructor) {
            for (const other of document.querySelectorAll<HTMLElement>('.modal.show')) {
                if (other !== element.current) {
                    ModalConstructor.getInstance(other)?.hide();
                }
            }
            previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            instance.current?.show();
        } else {
            instance.current?.hide();
        }
    }, [open, ModalConstructor]);

    if (typeof document === 'undefined' || !ModalConstructor) {
        return null;
    }

    return createPortal(
        <div className="modal" ref={element} tabIndex={-1} aria-labelledby={labelledBy}>
            <div
                className={`modal-dialog modal-dialog-centered modal-dialog-scrollable${size ? ` modal-${size}` : ''}`}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}
