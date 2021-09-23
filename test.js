// set current account
currentAccount = null;


function handleAccountsChangedv2(accounts) {
    
    
    if (accounts.length === 0) {
        // console.log('Please connect to MetaMask.');
        
    } else if (accounts[0] !== currentAccount) {

        currentAccount = accounts[0];
        w3 = new Web3(window.ethereum);
        jQuery('#_auction_fr_connect').css({'display' : 'none'});
        if(currentAccount != null) {
            // Set the button label
            //jQuery('#enableMetamask').html(currentAccount)
        }
    }
    
}

function connectHandlerv2() {
    connectv2();
    setInterval(connectv2, 1000);
  }

  async function handleUI(){
  	let resp2 = await GetAuctionDetails2(nftData.auction);
  	GetData();
  	
  	timerUpdate();
  	//console.log(resp2);
  	jQuery("#_auction_owned_by").css("display","block");
  	if (resp2.approved){
  		jQuery("#_auction_fr_approve").css('display','none');
  		jQuery("#_auction_not_approved").css('display','none');
  		let done_resp = await isDone();
		if ( !done_resp){
			jQuery("#_auction_amount").css("display","block");
		}
		  
		  
		  
		  loadHistory();
		  CheckBid();
     	
  	}else{
  		if (currentAccount && currentAccount.toLowerCase() == resp2.curator.toLowerCase()){
  			jQuery("#_auction_fr_approve").css('display','block');

  		}else{
			  if (resp2.tokenOwner == "0x0000000000000000000000000000000000000000"){
				jQuery("#_auction_not_approved").html("Auction Ended");
				jQuery('#_auction_fr_end_auction').css('display','none')
				jQuery("#_auction_owned_by").css("display","none");
				jQuery("#_auction_amount").css("display","none");
				loadHistory();
			  }else{
			  	jQuery("#_auction_fr_connect").html('connect To Approve')
			  }

			  jQuery("#_auction_not_approved").css('display','block');
			  
		  }
  		
  	}
     

  }

  function connectv2() {
    
    ethereum
      .request({ method: "eth_requestAccounts" })
      .then(
      	(accounts) => {
      		handleAccountsChangedv2(accounts);
      		
      		//handleUI();
      	}
      	)
      .catch((err) => {
        if (err.code === 4001) {
          // console.log("Please connect to MetaMask.");
        } else {
          // console.error(err);
        }
      });
  }

// connect wallet



async function GetData(){
	
	// run code
	let _nft_data_url = await GetNftUri( nftData.token , nftData.tokenContract );
	
	jQuery.getJSON(_nft_data_url, function( _data ){
		jQuery('#main img.wp-post-image').attr('src', _data.image);
		jQuery('#main img.wp-post-image').attr('alt', _data.name);
		let _old_product_name = jQuery('#main .entry-summary .product_title').html();
		jQuery('#main .entry-summary .product_title').html( _data.name );
		
		let _breadCrumb = jQuery('.woocommerce-breadcrumb').html();
		jQuery('.woocommerce-breadcrumb').html( _breadCrumb.replace(_old_product_name, _data.name ) );
	});

	
}


async function GetNFTData($token, $contract) {
	// body...
	let __url = await GetNftUri( $token , $contract );
	return __url;
}

function ShopProducts(){
	console.log("called");
	if( jQuery('ul.products').length > 0 ){
		jQuery('ul.products > li').each(function(){
			let __this = jQuery(this);
			console.log("reached");
			GetNFTData( jQuery(__this).data('token'), jQuery(__this).data('tokencontract') ).then( function( _url ) {
				console.log( _url );
				console.log("setting");
				jQuery.getJSON( _url, function( _data ){
					if( jQuery(__this).find('img').length ){
						let __img = jQuery(__this).find('img');
						jQuery(__img).attr('src', _data.image);
						jQuery(__img).attr('srcset', '');
					}
					if( jQuery(__this).find('.woocommerce-loop-product__title').length ){
						let __title = jQuery(__this).find('.woocommerce-loop-product__title');
						// console.log(_data.name);
						jQuery(__title).html(_data.name);
					}
				});
			} );			
		});
	}
}

async function isDone(){
	let resp2 = await GetAuctionDetails2(nftData.auction);
	let d1 = new Date((Number(resp2.duration) + Number(resp2.firstBidTime)) * 1000);
	time = timeBetweenDates(d1,resp2);
    let cond  = (JSON.stringify(time) == JSON.stringify([0,0,0,0]) && resp2.tokenOwner != "0x0000000000000000000000000000000000000000") && resp2.firstBidTime != "0" ||  resp2.firstBidTime == "0" && resp2.tokenOwner == "0x0000000000000000000000000000000000000000"
	return cond

}

async function CheckBid(){
	let aunctionDetails = await GetAuctionDetails2( nftData.auction );
	//jQuery('#_auction_timing').css({ 'display': 'block' });
	
	if( aunctionDetails.firstBidTime === '0' && currentAccount != null ){
		// show auction price
		jQuery('#_auction_reserve_price').css({ 'display': 'block' });
		console.log("block here")
		jQuery('#_auction_fr_place_bid').css({'display' : 'block'});
		
	}else if (currentAccount == null){
		let done_resp = await isDone();
		if (done_resp){
			jQuery("#_auction_fr_connect").html("Connect To End Auction")
		}else{
			jQuery("#_auction_fr_connect").html("Connect To place Bid")
		}
		
	}
}




function loadContract2(abi,add){
        let c = new w3.eth.Contract(abi,add);
        return c;
    }

async function GetAuctionDetails2(auctionId){
	let c;
	if (currentAccount){
		c = loadContract2(HouseAbi,TestNetContract);
	}else{
		c = loadContract3(HouseAbi,TestNetContract);
	}
    let resp = await c.methods.auctions(auctionId).call();
    return resp;
}

function createBid(auctionId,amount){
	// console.log( auctionId + '::' + amount );
	let c = loadContract2(HouseAbi,TestNetContract);
	c.methods.createBid(auctionId,Web3.utils.toWei(String(amount),'ether')).send(
	{
		from:currentAccount,
		value: Web3.utils.toWei(String(amount),'ether')
	}
	).then(
		(res) => {
			alert('created bid');
			loadHistory();
			CheckBid();
		}
	).catch(
		error => {
			console.log(error);
			alert('failed bid');
		}
	)
}

async function loadHistory(){
	let c;
	if (currentAccount){
		c = loadContract2(HouseAbi,TestNetContract);
	}else{
		c = loadContract3(HouseAbi,TestNetContract);
	}
	
	c.getPastEvents('AuctionBid', {fromBlock:nftData.block,filter : {
		auctionId : nftData.auction
	}}).then(res => {

		let _liHtml = '';
		// console.log( res );
		let tempres = res.reverse();
		if( tempres.length ){
			tempres.forEach( function( _elem, _index ) {
				_liHtml += '<li>' + _elem.returnValues.sender + ' : ' + 
				Web3.utils.fromWei(_elem.returnValues.value,'ether')  + '</li>';
			} )
		}else{
			_liHtml = 'No Bids Available';
		}
		console.log(_liHtml)

		jQuery('#_action_history ul').html( _liHtml );

	});
}

// date diff formater
function timeBetweenDates(toDate,res) {
	  var dateEntered = toDate;
	  var now = new Date();
	  var difference = dateEntered.getTime() - now.getTime();

	  if (difference <= 0) {
	  	//console.log('ended ??')
	    // console.log('done');
	    if (res.tokenOwner != "0x0000000000000000000000000000000000000000" && currentAccount && res.firstBidTime != "0"){
	    	jQuery('#_auction_fr_end_auction').css('display','block');
            jQuery('#_auction_amount').css('display','none');
            jQuery('#_auction_fr_place_bid').css('display','none');
	    }
	    
	    
	    //jQuery('#_bidder_amount').css('display','none');
	    
	    return [0,0,0,0]

	  } else {
	  	jQuery("#_auction_amount").css("display","block");

	    var seconds = Math.floor(difference / 1000);
	    var minutes = Math.floor(seconds / 60);
	    var hours = Math.floor(minutes / 60);
	    var days = Math.floor(hours / 24);

	    hours %= 24;
	    minutes %= 60;
	    seconds %= 60;

			// console.log(days);
	  //   	console.log(hours);
			// console.log(minutes);
			// console.log(seconds);
			//jQuery('#_auction_fr_place_bid').css('display','block');
			return [days,hours,minutes,seconds]

	  }
	}


// update timer

async function timerUpdate(){
	let res = await GetAuctionDetails2(nftData.auction);
	// console.log(res);
	if (res.tokenOwner != "0x0000000000000000000000000000000000000000"){
		jQuery('#__token__owner').html( res.tokenOwner );
		jQuery('#__token__owner').attr('href', 'https://etherscan.io/address/' + res.tokenOwner)
		if (res.bidder != "0x0000000000000000000000000000000000000000"){
			jQuery('#_bidder').text(res.bidder);
		jQuery('#_bidder_amount').text(Web3.utils.fromWei(res.amount,'ether')+ ' ETH');

		jQuery('#_bidder').css("display","block");
			jQuery('#_bidder_amount').css("display","block");
		}else{
			jQuery('#_bidder').css("display","none");
			jQuery('#_bidder_amount').css("display","none");
		}
		
	}else{
		jQuery('#__token__owner').css('display','none');
		jQuery('#_bidder').css('display','none');
		jQuery('#_bidder_amount').css("display","none");
	}
	let time;
	if (res.firstBidTime != "0"){
		let d1 = new Date((Number(res.duration) + Number(res.firstBidTime)) * 1000);
		time = timeBetweenDates(d1,res);
	}else if(res.firstBidTime == "0" && res.tokenOwner != "0x0000000000000000000000000000000000000000"){
		let now = new Date();
		//console.log(res);
		let d1 = new Date(now.getTime() + (Number(res.duration) * 1000));
		//console.log(d1);
		time = timeBetweenDates(d1,res);
		time[3] = 0
	}else{
		time = [0,0,0,0]
	}
	//console.log(time)
	
	jQuery('#_auction_timing').css({ 'display': 'block' });
	jQuery('#_day').text(time[0]);
	jQuery('#_hours').text(time[1]);
	jQuery('#_mins').text(time[2]);
	jQuery('#_secs').text(time[3]);
	



}

async function Approve(){
	let c = loadContract2(HouseAbi,TestNetContract);
	let res = await c.methods.setAuctionApproval(nftData.auction,true).send({from:currentAccount});
	if (res){
		console.log(res);
	}
	
}

async function EndAuction(){
	let c = loadContract2(HouseAbi,TestNetContract);
	let res = await c.methods.endAuction(nftData.auction).send({from:currentAccount});
	console.log(res);
}

window.addEventListener("load", function () {
	ShopProducts();
	if( document.getElementById("_auction_fr_place_bid") ){
        // create bid button
        const btnCreateBid = document.getElementById("_auction_fr_place_bid");
        const btnConnect = document.getElementById("_auction_fr_connect");
        const btnEnd = document.getElementById("_auction_fr_end_auction");
        const approveBtn = document.getElementById("_auction_fr_approve");
        btnCreateBid.addEventListener("click", function() { createBid(nftData.auction, document.getElementById("_auction_amount").value) } );
        btnConnect.addEventListener("click",connectHandlerv2);
        btnEnd.addEventListener("click",EndAuction);
        approveBtn.addEventListener("click",Approve);
		jQuery("#_auction_owned_by").css("display","none");
		jQuery("#_auction_amount").css("display","none");
		setInterval(handleUI,1000);
    }else{
      // console.log( "nothing found" );
    }

});

//0x0000000000000000000000000000000000000000