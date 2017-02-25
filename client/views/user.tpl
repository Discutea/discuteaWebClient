{{#if users.length}}
<div class="count">
	<input class="search" placeholder="{{users users.length}}" aria-label="Search among the user list">
</div>
{{/if}}

<div class="names">
	{{#each users}}
		<span role="button" class="tooltipped tooltipped-n user {{modes mode}} {{colorGecos gecos}}" data-name="{{name}}" aria-label="{{ gecos }}">{{mode}}{{name}}</span>
    {{/each}}
</div>
