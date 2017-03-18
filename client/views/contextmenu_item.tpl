<li class="context-menu-item context-menu-{{class}}" data-action="{{class}}"{{#if data}} data-data="{{data}}"{{/if}}>
    {{#if locale}}
      {{{ trans text locale }}}
    {{else}}
      {{ text }}
    {{/if}}
</li>
