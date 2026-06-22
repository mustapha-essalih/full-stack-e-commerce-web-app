<?php

declare(strict_types=1);

$finder = PhpCsFixer\Finder::create()
    ->in([
        __DIR__ . '/app',
        __DIR__ . '/config',
        __DIR__ . '/database',
        __DIR__ . '/routes',
        __DIR__ . '/tests',
    ])
    ->notPath('vendor')
    ->notPath('storage')
    ->notPath('bootstrap/cache');

return (new PhpCsFixer\Config())
    ->setRules([
        '@PSR12' => true,
        'declare_strict_types' => true,
        'blank_line_after_namespace' => true,
        'braces' => true,
        'class_definition' => true,
        'elseif' => true,
        'function_declaration' => true,
        'indentation_type' => true,
        'line_ending' => true,
        'lowercase_keywords' => true,
        'method_argument_space' => true,
        'no_break_comment' => true,
        'no_closing_tag' => true,
        'no_spaces_after_function_name' => true,
        'no_spaces_inside_parenthesis' => true,
        'no_trailing_whitespace' => true,
        'no_trailing_whitespace_in_comment' => true,
        'single_blank_line_at_eof' => true,
        'single_class_element_per_statement' => true,
        'single_import_per_statement' => true,
        'single_line_after_imports' => true,
        'switch_case_semicolon_to_colon' => true,
        'switch_case_space' => true,
        'visibility_required' => true,
        'encoding' => true,
        'full_opening_tag' => true,
    ])
    ->setFinder($finder);
