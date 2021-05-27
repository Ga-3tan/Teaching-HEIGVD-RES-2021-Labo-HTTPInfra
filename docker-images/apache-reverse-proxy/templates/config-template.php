<?php
$static  = getenv('STATIC_APP');
$dynamic = getenv('DYNAMIC_APP');
?>

<VirtualHost *:80>
	ServerName demo.res.ch
	
	# Route for the dynamic express server
	ProxyPass '/api/' 'http://<?php echo $dynamic ?>/'
	ProxyPassReverse '/api/' 'http://<?php echo $dynamic ?>/'
	
	# Route for the static apache server
	ProxyPass '/' 'http://<?php echo $static ?>/'
	ProxyPassReverse '/' 'http://<?php echo $static ?>/'
</VirtualHost>