import { marked, type MarkedToken, type Token, type Tokens } from 'marked';
import { Fragment, useId, type ReactNode } from 'react';
import { externalLinkRel } from '../../../shared/links';
import { marketImagePath } from '../../../shared/packages/presentation';
import { decodeFragment, documentationHeading } from '../../lib/documentation';

function markdownUrl(value: string, image = false): string | undefined {
    if (!value || /[\s\\\p{Cc}]/u.test(value)) {
        return;
    }
    if (/^\/(?!\/)/.test(value) || (!image && /^(?:#|mailto:)/i.test(value))) {
        return value;
    }
    if (!/^https:\/\//i.test(value)) {
        return;
    }
    try {
        const url = new URL(value);
        if (url.protocol === 'https:' && !url.username && !url.password) {
            return url.href;
        }
    } catch (error) {
        if (!(error instanceof TypeError)) {
            throw error;
        }
    }
}

export function ResourceMarkdown({
    markdown,
    images,
    previewImages,
    headingLevel = 2,
}: {
    markdown: string;
    images?: Readonly<Record<string, string>>;
    previewImages?: Readonly<Record<string, string>>;
    headingLevel?: 2 | 3;
}) {
    const id = useId();
    const headings = new Map<string, number>();
    let baseDepth = 1;

    function imageUrl(value: string) {
        const path = marketImagePath(value.replace(/^\.\//, ''));
        if (path && previewImages && Object.hasOwn(previewImages, path)) {
            const preview = previewImages[path];
            if (preview.startsWith('blob:')) {
                return preview;
            }
        }
        if (path && images && Object.hasOwn(images, path)) {
            return markdownUrl(images[path], true);
        }
        return markdownUrl(value, true);
    }

    function renderTokens(tokens: Token[], block = false, depth = 0): ReactNode {
        if (depth > 40) {
            return null;
        }
        return tokens.map((token, index) => <Fragment key={index}>{renderToken(token, block, depth)}</Fragment>);
    }

    function renderToken(input: Token, block: boolean, depth: number): ReactNode {
        const token = input as MarkedToken;
        const children = (tokens: Token[], block = false) => renderTokens(tokens, block, depth + 1);
        switch (token.type) {
            case 'heading': {
                const level = Math.min(Math.max(token.depth - baseDepth + headingLevel, headingLevel), 6);
                const Heading = `h${level}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
                const slug = documentationHeading(token.text);
                const count = headings.get(slug) ?? 0;
                headings.set(slug, count + 1);
                return <Heading id={`${id}-${slug}${count ? `-${count}` : ''}`}>{children(token.tokens)}</Heading>;
            }
            case 'paragraph':
                return <p>{children(token.tokens)}</p>;
            case 'text': {
                const contents = token.tokens ? children(token.tokens) : token.text;
                return block ? <p>{contents}</p> : contents;
            }
            case 'escape':
                return token.text;
            case 'strong':
                return <strong>{children(token.tokens)}</strong>;
            case 'em':
                return <em>{children(token.tokens)}</em>;
            case 'del':
                return <del>{children(token.tokens)}</del>;
            case 'codespan':
                return <code>{token.text}</code>;
            case 'code':
                return (
                    <pre>
                        <code>{token.text}</code>
                    </pre>
                );
            case 'br':
                return <br />;
            case 'hr':
                return <hr />;
            case 'blockquote':
                return <blockquote>{children(token.tokens, true)}</blockquote>;
            case 'list': {
                const items = token.items.map((item, index) => (
                    <li key={index}>{children(item.tokens, token.loose)}</li>
                ));
                return token.ordered ? <ol start={token.start || undefined}>{items}</ol> : <ul>{items}</ul>;
            }
            case 'checkbox':
                return <input className="form-check-input me-2" type="checkbox" checked={token.checked} disabled />;
            case 'table': {
                const cells = (row: Tokens.TableCell[], header = false) =>
                    row.map((cell, index) => {
                        const Cell = header ? 'th' : 'td';
                        return (
                            <Cell key={index} scope={header ? 'col' : undefined}>
                                {children(cell.tokens)}
                            </Cell>
                        );
                    });
                return (
                    <div className="table-responsive">
                        <table className="table table-bordered align-middle">
                            <thead>
                                <tr>{cells(token.header, true)}</tr>
                            </thead>
                            <tbody>
                                {token.rows.map((row, index) => (
                                    <tr key={index}>{cells(row)}</tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }
            case 'link': {
                const href = markdownUrl(token.href);
                const content = children(token.tokens);
                if (!href) {
                    return content;
                }
                if (href.startsWith('#')) {
                    return <a href={`#${id}-${documentationHeading(decodeFragment(href))}`}>{content}</a>;
                }
                const external = href.startsWith('https:');
                return (
                    <a
                        href={href}
                        title={token.title ?? undefined}
                        target={external ? '_blank' : undefined}
                        rel={external ? externalLinkRel(href) : undefined}
                    >
                        {content}
                    </a>
                );
            }
            case 'image': {
                const src = imageUrl(token.href);
                return src ? (
                    <img
                        src={src}
                        alt={token.text}
                        title={token.title ?? undefined}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    token.text
                );
            }
            default:
                return null;
        }
    }

    let tokens: Token[];
    try {
        tokens = marked.lexer(markdown);
    } catch (error) {
        if (!(error instanceof RangeError)) {
            throw error;
        }
        return <p className="resource-description">{markdown}</p>;
    }
    const depths = tokens.flatMap((token) => (token.type === 'heading' ? [(token as Tokens.Heading).depth] : []));
    if (depths.length) {
        baseDepth = Math.min(...depths);
    }
    return <div className="resource-markdown">{renderTokens(tokens, true)}</div>;
}
