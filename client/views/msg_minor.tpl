<div class="msg kick warn">
	<span class="time"></span>
	<span class="from"> {{ trans 'warning' locale.locale }}</span>
	<span class="text">
      {{#if age}}
        <span class="text">
          {{{ trans 'minor_msg' locale.locale }}}
        </span>
      {{else}}
        <span class="text">
          {{{ trans 'minor_undefined_msg' locale.locale }}}
       </span>
      {{/if}}
    </span>
</div>
